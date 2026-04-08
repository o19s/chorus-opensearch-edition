#!/bin/bash

# Script to set up Chorus team roles and users in OpenSearch
# Creates custom roles and users with appropriate permissions
# Based on: https://docs.opensearch.org/latest/security/access-control/api/

set -e

# Configuration
OPENSEARCH_HOST="${OPENSEARCH_HOST:-https://localhost:9200}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-MyStr0ng!P@ssw0rd2024}"

echo "=========================================="
echo "Setting up Chorus Team in OpenSearch"
echo "=========================================="


# Create product_manager role - read-write access to data indices, read-only on config
# This demonstrates that product managers can work with data but cannot modify search configuration
# Only relevance engineers have write access to search-relevance-search-config
echo ""
echo "Creating role: product_manager"
curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/roles/product_manager" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "cluster_permissions": [
      "cluster_composite_ops",
      "indices_monitor",
      "cluster:admin/opensearch/search_relevance/*"
    ],
    "index_permissions": [
      {
        "index_patterns": [
          "ecommerce",
          "ecommerce_*",
          "products",
          "products_*",
          "logs-*",
          ".kibana*",
          ".opensearch-dashboards*",
          "search-relevance-*",
          "ubi_*"
        ],
        "allowed_actions": [
          "indices:data/read/*",
          "indices:data/write/*",
          "indices:admin/mappings/get",
          "indices:admin/get",
          "indices:admin/refresh",
          "indices:admin/validate/query"
        ]
      },
      {
        "index_patterns": [
          "search-relevance-search-config"
        ],
        "allowed_actions": [
          "indices:data/read/*",
          "indices:admin/mappings/get",
          "indices:admin/get"
        ]
      }
    ]
  }'


# Create relevance_engineer role - full access to all indices and cluster operations
echo ""
echo "Creating role: relevance_engineer"
curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/roles/relevance_engineer" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "cluster_permissions": [
      "cluster:*"
    ],
    "index_permissions": [{
      "index_patterns": [
        "*"
      ],
      "allowed_actions": [
        "indices:*"
      ]
    }]
  }'

echo ""

# Create Pete the Product Manager
USERNAME="pete"
FULL_NAME="Pete the Product Manager"
USER_PASSWORD="MyStr0ng!P@ssw0rd2024"
BACKEND_ROLES='["kibana_user", "readall", "product_manager"]'
OPENSEARCH_ROLES='["kibana_user", "readall", "product_manager"]'

echo ""
echo "Creating user: ${USERNAME} (${FULL_NAME}) w/ password ${ADMIN_PASSWORD}"

curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/internalusers/${USERNAME}" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d "{
    \"password\": \"${USER_PASSWORD}\",
    \"opendistro_security_roles\": ${OPENSEARCH_ROLES},
    \"backend_roles\": ${BACKEND_ROLES},
    \"attributes\": {
      \"full_name\": \"${FULL_NAME}\"
    }
  }"

echo ""

# Create Rumi the Relevance Engineer
USERNAME="rumi"
FULL_NAME="Rumi the Relevance Engineer"
USER_PASSWORD="MyStr0ng!P@ssw0rd2024"
BACKEND_ROLES='["kibana_user", "readall", "relevance_engineer"]'
OPENSEARCH_ROLES='["kibana_user", "readall", "relevance_engineer"]'

echo ""
echo "Creating user: ${USERNAME} (${FULL_NAME}) w/ password ${ADMIN_PASSWORD}"

curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/internalusers/${USERNAME}" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d "{
    \"password\": \"${USER_PASSWORD}\",
    \"opendistro_security_roles\": ${OPENSEARCH_ROLES},
    \"backend_roles\": ${BACKEND_ROLES},
    \"attributes\": {
      \"full_name\": \"${FULL_NAME}\"
    }
  }"

echo ""


# Create Eddie the Expert User Person
USERNAME="eddie"
FULL_NAME="Eddie the Expert User"
USER_PASSWORD="MyStr0ng!P@ssw0rd2024"
BACKEND_ROLES='["kibana_user", "readall", "product_manager"]'
OPENSEARCH_ROLES='["kibana_user", "readall", "product_manager"]'

echo ""
echo "Creating user: ${USERNAME} (${FULL_NAME}) w/ password ${ADMIN_PASSWORD}"

curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/internalusers/${USERNAME}" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d "{
    \"password\": \"${USER_PASSWORD}\",
    \"opendistro_security_roles\": ${OPENSEARCH_ROLES},
    \"backend_roles\": ${BACKEND_ROLES},
    \"attributes\": {
      \"full_name\": \"${FULL_NAME}\"
    }
  }"

echo ""


# Check if Search workspace already exists
echo ""
echo "Checking for existing 'Chorus Production' workspace..."

EXISTING_WORKSPACES=$(curl -s -X POST \
  "http://localhost:5601/api/workspaces/_list" \
  -H "Content-Type: application/json" \
  -H "osd-xsrf: true" \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "search": "Chorus Production",
    "perPage": 100,
    "page": 1
  }')

# Try to extract existing workspace ID
WORKSPACE_ID=$(echo "$EXISTING_WORKSPACES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$WORKSPACE_ID" ]; then
  echo "✓ Found existing 'Chorus Production' workspace"
  echo "  URL: http://localhost:5601/w/${WORKSPACE_ID}/app/home"
else
  # Create new Search workspace
  echo "Creating new 'Search' workspace..."
  
  WORKSPACE_RESPONSE=$(curl -s -X POST \
    "http://localhost:5601/api/workspaces" \
    -H "Content-Type: application/json" \
    -H "osd-xsrf: true" \
    -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
    -d '{
      "attributes": {
        "name": "Chorus Production",
        "description": "Search relevance workspace for production testing and optimization",
        "features": ["use-case-search"],
        "color": "#0073E6"
      }
    }')

  # Extract workspace ID from response
  WORKSPACE_ID=$(echo "$WORKSPACE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$WORKSPACE_ID" ]; then
    echo ""
    echo "✓ Workspace 'Chorus Production' created successfully!"
    echo "  URL: http://localhost:5601/w/${WORKSPACE_ID}/app/home"
  else
    echo ""
    echo "⚠ Workspace creation failed. Response: $WORKSPACE_RESPONSE"
  fi
fi
