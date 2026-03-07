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

# ==========================================
# STEP 1: Create Custom Roles
# ==========================================

echo ""
echo "STEP 1: Creating custom roles..."

# Create product_manager role - read-only access to search-relevance-search-config index
echo ""
echo "Creating role: product_manager"
curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/roles/product_manager" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "cluster_permissions": [
      "cluster_composite_ops_ro"
    ],
    "index_permissions": [{
      "index_patterns": [
        "search-relevance-search-config"
      ],
      "allowed_actions": [
        "indices:data/read/*",
        "indices:admin/mappings/get",
        "indices:admin/get"
      ]
    }]
  }'

echo ""
echo "✓ Role 'product_manager' created successfully!"

# Create relevance_engineer role - full access to search-relevance-search-config index
echo ""
echo "Creating role: relevance_engineer"
curl -k -X PUT \
  "${OPENSEARCH_HOST}/_plugins/_security/api/roles/relevance_engineer" \
  -H 'Content-Type: application/json' \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "cluster_permissions": [
      "cluster_composite_ops",
      "indices_monitor"
    ],
    "index_permissions": [{
      "index_patterns": [
        "search-relevance-search-config"
      ],
      "allowed_actions": [
        "indices:*"
      ]
    }]
  }'

echo ""
echo "✓ Role 'relevance_engineer' created successfully!"

# ==========================================
# STEP 2: Create Users
# ==========================================

echo ""
echo "STEP 2: Creating users..."

# Create Pete the Product Manager
USERNAME="pete"
FULL_NAME="Pete the Product Manager"
USER_PASSWORD="MyStr0ng!P@ssw0rd2024"
BACKEND_ROLES='["kibana_user", "readall", "product_manager"]'
OPENSEARCH_ROLES='["kibana_user", "readall", "product_manager"]'

echo ""
echo "Creating user: ${USERNAME} (${FULL_NAME})"

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
echo "✓ User '${USERNAME}' created successfully!"

# Create Rumi the Relevance Engineer
USERNAME="rumi"
FULL_NAME="Rumi the Relevance Engineer"
USER_PASSWORD="MyStr0ng!P@ssw0rd2024"
BACKEND_ROLES='["kibana_user", "readall", "relevance_engineer"]'
OPENSEARCH_ROLES='["kibana_user", "readall", "relevance_engineer"]'

echo ""
echo "Creating user: ${USERNAME} (${FULL_NAME})"

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
echo "✓ User '${USERNAME}' created successfully!"

# ==========================================
# Summary
# ==========================================

echo ""
echo "=========================================="
echo "STEP 3: Creating/Finding Search Workspace"
echo "=========================================="

# Check if Search workspace already exists
echo ""
echo "Checking for existing 'Search' workspace..."

EXISTING_WORKSPACES=$(curl -s -X POST \
  "http://localhost:5601/api/workspaces/_list" \
  -H "Content-Type: application/json" \
  -H "osd-xsrf: true" \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d '{
    "search": "Search",
    "perPage": 100,
    "page": 1
  }')

# Try to extract existing workspace ID
WORKSPACE_ID=$(echo "$EXISTING_WORKSPACES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$WORKSPACE_ID" ]; then
  echo "✓ Found existing 'Search' workspace"
  echo "  Workspace ID: ${WORKSPACE_ID}"
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
        "name": "Search",
        "description": "Search relevance workspace for testing and optimization",
        "features": ["use-case-search"],
        "color": "#0073E6"
      }
    }')

  echo "$WORKSPACE_RESPONSE"

  # Extract workspace ID from response
  WORKSPACE_ID=$(echo "$WORKSPACE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$WORKSPACE_ID" ]; then
    echo ""
    echo "✓ Workspace 'Search' created successfully!"
    echo "  Workspace ID: ${WORKSPACE_ID}"
    echo "  URL: http://localhost:5601/w/${WORKSPACE_ID}/app/home"
  else
    echo ""
    echo "⚠ Workspace creation failed. Response: $WORKSPACE_RESPONSE"
  fi
fi

# Save workspace ID to a file for future reference
if [ -n "$WORKSPACE_ID" ]; then
  echo "$WORKSPACE_ID" > .workspace_id
  echo ""
  echo "✓ Workspace ID saved to .workspace_id file"
fi

# ==========================================
# Summary
# ==========================================

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Roles Created:"
echo "  • product_manager: Read-only access to search-relevance-search-config"
echo "  • relevance_engineer: Full access to search-relevance-search-config"
echo ""
echo "Users Created:"
echo "  • pete (Pete the Product Manager)"
echo "    - Username: pete"
echo "    - Password: MyStr0ng!P@ssw0rd2024"
echo "    - Roles: kibana_user, readall, product_manager"
echo "    - Workspace Access: Read-only"
echo ""
echo "  • rumi (Rumi the Relevance Engineer)"
echo "    - Username: rumi"
echo "    - Password: MyStr0ng!P@ssw0rd2024"
echo "    - Roles: kibana_user, readall, relevance_engineer"
echo "    - Workspace Access: Full access (read/write)"
echo ""
echo "Workspace Created:"
echo "  • Search (use-case-search)"
if [ -n "$WORKSPACE_ID" ]; then
  echo "    - Direct URL: http://localhost:5601/w/${WORKSPACE_ID}/app/home"
fi
echo ""
echo "Login at: http://localhost:5601"
echo "=========================================="
