#!/usr/bin/env bash
set -e

OS_URL="https://localhost:9200"
os_curl() { curl -s -k -u 'admin:MyStr0ng!P@ssw0rd2024' "$@"; }

echo "=== 1. Pre-warming Ollama (qwen2.5:1.5b) in RAM ==="
docker exec ollama ollama pull qwen2.5:1.5b
curl -s -X POST "http://localhost:11434/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5:1.5b", "prompt": "hi", "stream": false, "keep_alive": -1}' > /dev/null

echo "=== 2. Configuring OpenSearch ML Commons Settings ==="
os_curl -X PUT "$OS_URL/_cluster/settings" -H 'Content-Type: application/json' -d '{
  "persistent": {
    "plugins.ml_commons.only_run_on_ml_node": false,
    "plugins.ml_commons.model_access_control_enabled": true,
    "plugins.ml_commons.native_memory_threshold": 99,
    "plugins.ml_commons.rag_pipeline_feature_enabled": true,
    "plugins.ml_commons.ml_task_timeout_in_seconds": 180,
    "plugins.ml_commons.trusted_connector_endpoints_regex": [
      "^https://runtime\\.sagemaker\\..*\\.amazonaws\\.com/.*$",
      "^https://api\\.openai\\.com/.*$",
      "^https://api\\.cohere\\.ai/.*$",
      "^http://ollama:11434/.*$",
      "^http://clip:8000/.*$"
    ]
  }
}' > /dev/null

echo "=== 3. Updating Ecommerce Index Mapping ==="
os_curl -X PUT "$OS_URL/ecommerce/_mapping" -H 'Content-Type: application/json' -d '{
  "properties": {
    "short_context": { "type": "text" },
    "image_url": { "type": "keyword" },
    "image_embedding": {
      "type": "knn_vector",
      "dimension": 512,
      "method": { "name": "hnsw", "space_type": "cosinesimil", "engine": "lucene" }
    }
  }
}' > /dev/null

TEXT_MODEL_ID=$(os_curl -X GET "$OS_URL/_ingest/pipeline/embeddings-pipeline" | jq -r '.[].processors[] | select(.text_embedding != null) | .text_embedding.model_id')

echo "=== 4. Registering & Deploying Local CLIP Model Connector ==="
CLIP_CONN_ID=$(os_curl -X POST "$OS_URL/_plugins/_ml/connectors/_create" -H 'Content-Type: application/json' -d '{
  "name": "Local CLIP ViT-B-32 Connector",
  "description": "Connects OpenSearch to local FastAPI CLIP container",
  "version": 1,
  "protocol": "http",
  "client_config": { "max_connection": 30, "connection_timeout": 60000, "read_timeout": 180000 },
  "parameters": { "model": "clip-ViT-B-32" },
  "actions": [{
    "action_type": "predict",
    "method": "POST",
    "url": "http://clip:8000/embed",
    "headers": { "Content-Type": "application/json" },
    "request_body": "{ \"image_url\": \"${parameters.image_url}\", \"text\": \"${parameters.text}\" }"
  }]
}' | jq -r '.connector_id')

CLIP_MODEL_ID=$(os_curl -X POST "$OS_URL/_plugins/_ml/models/_register?deploy=true" -H 'Content-Type: application/json' -d "{
  \"name\": \"local-clip-vit-b-32\",
  \"function_name\": \"remote\",
  \"description\": \"Local CLIP Multimodal Embedding Model\",
  \"connector_id\": \"$CLIP_CONN_ID\"
}" | jq -r '.model_id')

echo "=== 5. Registering & Deploying Local Ollama (qwen2.5:1.5b) Connector ==="
OLLAMA_CONN_ID=$(os_curl -X POST "$OS_URL/_plugins/_ml/connectors/_create" -H 'Content-Type: application/json' -d '{
  "name": "Local Ollama Qwen Connector",
  "description": "Connects OpenSearch RAG processor to local Ollama container",
  "version": 1,
  "protocol": "http",
  "client_config": { "max_connection": 30, "connection_timeout": 60000, "read_timeout": 180000 },
  "parameters": { "model": "qwen2.5:1.5b" },
  "credential": { "openAI_key": "ollama" },
  "actions": [{
    "action_type": "predict",
    "method": "POST",
    "url": "http://ollama:11434/v1/chat/completions",
    "headers": { "Content-Type": "application/json" },
    "request_body": "{ \"model\": \"qwen2.5:1.5b\", \"messages\": ${parameters.messages}, \"temperature\": 0.3, \"max_tokens\": 350 }"
  }]
}' | jq -r '.connector_id')

OLLAMA_MODEL_ID=$(os_curl -X POST "$OS_URL/_plugins/_ml/models/_register?deploy=true" -H 'Content-Type: application/json' -d "{
  \"name\": \"local-ollama-qwen\",
  \"function_name\": \"remote\",
  \"description\": \"Local Ollama Qwen 2.5 1.5B LLM\",
  \"connector_id\": \"$OLLAMA_CONN_ID\"
}" | jq -r '.model_id')
sleep 2

echo "=== 6. Populating Max-Field Null-Safe short_context Across Catalog ==="
os_curl -X POST "$OS_URL/ecommerce/_update_by_query?conflicts=proceed&refresh=true" -H 'Content-Type: application/json' -d '{
  "script": {
    "lang": "painless",
    "source": "StringBuilder sb = new StringBuilder(); if (ctx._source.title != null) sb.append(\"Item: \").append(ctx._source.title).append(\" | \"); if (ctx._source.brand != null) sb.append(\"Brand: \").append(ctx._source.brand).append(\" | \"); if (ctx._source.color != null) sb.append(\"Color: \").append(ctx._source.color).append(\" | \"); if (ctx._source.price != null) sb.append(\"Price: $\").append(ctx._source.price).append(\" | \"); if (ctx._source.rating != null) sb.append(\"Rating: \").append(ctx._source.rating).append(\"/5 | \"); if (ctx._source.category != null) sb.append(\"Category: \").append(ctx._source.category).append(\" | \"); if (ctx._source.bullet_points != null) { String bp = ctx._source.bullet_points.toString(); if (bp.length() > 180) bp = bp.substring(0, 180); sb.append(\"Highlights: \").append(bp).append(\" \"); } if (ctx._source.description != null) { String d = ctx._source.description.toString(); if (d.length() > 180) d = d.substring(0, 180); sb.append(\"Details: \").append(d); } ctx._source.short_context = sb.toString();"
  }
}' | jq '{total: .total, updated: .updated}'

echo "=== 7. Updating Ingest Pipeline (embeddings-pipeline) ==="
os_curl -X PUT "$OS_URL/_ingest/pipeline/embeddings-pipeline" -H 'Content-Type: application/json' -d "{
  \"description\": \"Max-field text + CLIP embedding pipeline\",
  \"processors\": [
    {
      \"script\": {
        \"lang\": \"painless\",
        \"source\": \"StringBuilder sb = new StringBuilder(); if (ctx.title != null) sb.append('Item: ').append(ctx.title).append(' | '); if (ctx.brand != null) sb.append('Brand: ').append(ctx.brand).append(' | '); if (ctx.color != null) sb.append('Color: ').append(ctx.color).append(' | '); if (ctx.price != null) sb.append('Price: $').append(ctx.price).append(' | '); if (ctx.rating != null) sb.append('Rating: ').append(ctx.rating).append('/5 | '); if (ctx.category != null) sb.append('Category: ').append(ctx.category).append(' | '); if (ctx.bullet_points != null) { String bp = ctx.bullet_points.toString(); sb.append('Highlights: ').append(bp.length() > 180 ? bp.substring(0, 180) : bp).append(' '); } if (ctx.description != null) { String d = ctx.description.toString(); sb.append('Details: ').append(d.length() > 180 ? d.substring(0, 180) : d); } ctx.short_context = sb.toString(); if (ctx.image != null && ctx.image_url == null) { ctx.image_url = ctx.image; }\"
      }
    },
    {
      \"text_embedding\": {
        \"model_id\": \"$TEXT_MODEL_ID\",
        \"field_map\": { \"short_context\": \"title_embedding\" }
      }
    },
    {
      \"ml_inference\": {
        \"model_id\": \"$CLIP_MODEL_ID\",
        \"input_map\": [ { \"image_url\": \"image_url\" } ],
        \"output_map\": [ { \"image_embedding\": \"embedding\" } ],
        \"full_response_path\": false,
        \"ignore_missing\": true,
        \"ignore_failure\": true
      }
    }
  ]
}" > /dev/null

echo "=== 8. Creating Unified Hybrid Search + RAG Pipeline (rag_pipeline) ==="
os_curl -X PUT "$OS_URL/_search/pipeline/rag_pipeline" -H 'Content-Type: application/json' -d "{
  \"description\": \"Humanised Chorus Conversational RAG Pipeline\",
  \"request_processors\": [
    {
      \"neural_query_enricher\": {
        \"default_model_id\": \"$TEXT_MODEL_ID\",
        \"neural_field_default_id\": { \"title_embedding\": \"$TEXT_MODEL_ID\" }
      }
    }
  ],
  \"phase_results_processors\": [
    {
      \"normalization-processor\": {
        \"normalization\": { \"technique\": \"min_max\" },
        \"combination\": { \"technique\": \"arithmetic_mean\", \"parameters\": { \"weights\": [0.35, 0.65] } }
      }
    }
  ],
  \"response_processors\": [
    {
      \"retrieval_augmented_generation\": {
        \"tag\": \"chorus_unified_rag\",
        \"model_id\": \"$OLLAMA_MODEL_ID\",
        \"context_field_list\": [\"short_context\"],
        \"system_prompt\": \"You are a warm, helpful human shopping assistant at Chorus. IF the shopper is just saying hi/hello, greet them warmly and ask what they are shopping for without recommending products. OTHERWISE:\\n1. NEVER write 'SEARCH RESULT 1', 'Item:', 'Category:', or copy raw metadata blocks. Speak naturally in conversational sentences.\\n2. Understand synonyms naturally (e.g., 'study table' matches 'computer desk' or 'writing desk').\\n3. Recommend the 1 to 3 best matching items from the context by name, mention their price/rating if available, and explain why they fit.\\n4. If the exact product requested is not in the context, politely let them know and proactively offer the closest related items from the context.\",
        \"user_instructions\": \"Reply naturally like a friendly human shopping advisor. Do not output raw 'SEARCH RESULT' headers.\"
      }
    }
  ]
}" | jq .

echo "=== RAG PoC Setup Complete! ==="
