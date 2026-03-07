#!/bin/bash

# Script to test permissions for Pete and Rumi

set -e

OPENSEARCH_HOST="${OPENSEARCH_HOST:-https://localhost:9200}"
INDEX_NAME="search-relevance-search-config"

echo "=========================================="
echo "Testing Permissions"
echo "=========================================="

# First, create the index if it doesn't exist (as admin)
echo ""
echo "Creating index (as admin)..."
curl -k -X PUT \
  "${OPENSEARCH_HOST}/${INDEX_NAME}" \
  -H 'Content-Type: application/json' \
  -u "admin:MyStr0ng!P@ssw0rd2024" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }' 2>/dev/null || echo "Index may already exist"

echo ""
echo ""

# ==========================================
# Test 1: Pete tries to write (should FAIL)
# ==========================================

echo "=========================================="
echo "TEST 1: Pete (Product Manager) tries to write"
echo "=========================================="
echo ""
echo "Attempting to index a document as Pete..."
echo ""

PETE_RESPONSE=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${OPENSEARCH_HOST}/${INDEX_NAME}/_doc" \
  -H 'Content-Type: application/json' \
  -u "pete:MyStr0ng!P@ssw0rd2024" \
  -d '{
    "config_name": "test_config_pete",
    "description": "Pete trying to write",
    "timestamp": "2024-03-07T12:00:00Z"
  }')

HTTP_CODE=$(echo "$PETE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$PETE_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "403" ]; then
  echo "✓ EXPECTED: Pete was denied write access (403 Forbidden)"
else
  echo "✗ UNEXPECTED: Pete got HTTP $HTTP_CODE (expected 403)"
fi

# ==========================================
# Test 2: Pete tries to read (should SUCCEED)
# ==========================================

echo ""
echo "=========================================="
echo "TEST 2: Pete (Product Manager) tries to read"
echo "=========================================="
echo ""
echo "Attempting to search as Pete..."
echo ""

PETE_READ_RESPONSE=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -X GET \
  "${OPENSEARCH_HOST}/${INDEX_NAME}/_search" \
  -H 'Content-Type: application/json' \
  -u "pete:MyStr0ng!P@ssw0rd2024")

HTTP_CODE=$(echo "$PETE_READ_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$PETE_READ_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ EXPECTED: Pete can read the index (200 OK)"
else
  echo "✗ UNEXPECTED: Pete got HTTP $HTTP_CODE (expected 200)"
fi

# ==========================================
# Test 3: Rumi tries to write (should SUCCEED)
# ==========================================

echo ""
echo "=========================================="
echo "TEST 3: Rumi (Relevance Engineer) tries to write"
echo "=========================================="
echo ""
echo "Attempting to index a document as Rumi..."
echo ""

RUMI_RESPONSE=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${OPENSEARCH_HOST}/${INDEX_NAME}/_doc" \
  -H 'Content-Type: application/json' \
  -u "rumi:MyStr0ng!P@ssw0rd2024" \
  -d '{
    "config_name": "test_config_rumi",
    "description": "Rumi successfully writing",
    "timestamp": "2024-03-07T12:00:00Z"
  }')

HTTP_CODE=$(echo "$RUMI_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RUMI_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✓ EXPECTED: Rumi successfully wrote to the index (201 Created)"
else
  echo "✗ UNEXPECTED: Rumi got HTTP $HTTP_CODE (expected 201)"
fi

# ==========================================
# Test 4: Rumi tries to read (should SUCCEED)
# ==========================================

echo ""
echo "=========================================="
echo "TEST 4: Rumi (Relevance Engineer) tries to read"
echo "=========================================="
echo ""
echo "Attempting to search as Rumi..."
echo ""

RUMI_READ_RESPONSE=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -X GET \
  "${OPENSEARCH_HOST}/${INDEX_NAME}/_search" \
  -H 'Content-Type: application/json' \
  -u "rumi:MyStr0ng!P@ssw0rd2024")

HTTP_CODE=$(echo "$RUMI_READ_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RUMI_READ_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response: $RESPONSE_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ EXPECTED: Rumi can read the index (200 OK)"
else
  echo "✗ UNEXPECTED: Rumi got HTTP $HTTP_CODE (expected 200)"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Pete (Product Manager):"
echo "  • Write access: ✗ Denied (read-only)"
echo "  • Read access:  ✓ Allowed"
echo ""
echo "Rumi (Relevance Engineer):"
echo "  • Write access: ✓ Allowed"
echo "  • Read access:  ✓ Allowed"
echo "=========================================="
