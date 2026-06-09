#!/bin/bash
set -euo pipefail

# Looks up or creates the "Chorus Production" workspace in OpenSearch Dashboards.
# Prints ONLY the workspace ID to stdout — log messages go to stderr so callers
# can capture the ID with: WORKSPACE_ID=$(./setup_chorus_workspace.sh)

ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-MyStr0ng!P@ssw0rd2024}"
OSD_URL="${OSD_URL:-http://localhost:5601}"
WORKSPACE_NAME="Chorus Production"

echo "Checking for existing '${WORKSPACE_NAME}' workspace..." >&2

EXISTING=$(curl -sf -X POST \
  "${OSD_URL}/api/workspaces/_list" \
  -H "Content-Type: application/json" \
  -H "osd-xsrf: true" \
  -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
  -d "{\"search\": \"${WORKSPACE_NAME}\", \"perPage\": 100, \"page\": 1}")

# jq's `// empty` returns empty string (not error) when the path doesn't exist —
# critical here because under `set -euo pipefail` a no-match `grep` would
# terminate the script before we could fall through to the create branch.
WORKSPACE_ID=$(echo "$EXISTING" | jq -r '.result.workspaces[0].id // empty')

if [ -n "$WORKSPACE_ID" ]; then
  echo "✓ Found existing '${WORKSPACE_NAME}' workspace (id: ${WORKSPACE_ID})" >&2
else
  echo "Creating new '${WORKSPACE_NAME}' workspace..." >&2
  RESPONSE=$(curl -sf -X POST \
    "${OSD_URL}/api/workspaces" \
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
  WORKSPACE_ID=$(echo "$RESPONSE" | jq -r '.result.id // empty')
  if [ -z "$WORKSPACE_ID" ]; then
    echo "ERROR: Workspace creation failed. Response: $RESPONSE" >&2
    exit 1
  fi
  echo "✓ Workspace '${WORKSPACE_NAME}' created (id: ${WORKSPACE_ID})" >&2
fi

echo "  Workspace home: ${OSD_URL}/w/${WORKSPACE_ID}/app/home" >&2

# Workspace ID -> stdout (only thing on stdout)
echo "$WORKSPACE_ID"
