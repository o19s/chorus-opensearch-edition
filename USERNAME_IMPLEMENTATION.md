# Username Header Implementation

## Overview

This implementation passes the logged-in user's username from OpenSearch Dashboards to the opensearch-agent-server via HTTP headers.

## Changes Made

### 1. OpenSearch Dashboards Changes

**File: `opensearch-dashboards/OpenSearch-Dashboards/src/plugins/chat/server/routes/index.ts`**

Modified the `forwardToAgUI` function to:
- Extract user information from the request's auth state
- Add `X-OpenSearch-User-Name` header to requests sent to AG-UI server
- Log the username for debugging

**File: `opensearch-dashboards/OpenSearch-Dashboards/src/plugins/chat/server/plugin.ts`**

Updated `defineRoutes` call to pass `core.http.auth` parameter.

### 2. opensearch-agent-server Changes

**File: `opensearch-agent-server/opensearch-agent-server/src/server/ag_ui_app.py`**

Modified the `/runs` endpoint to:
- Extract username from `X-OpenSearch-User-Name` header
- Extract user ID from `X-OpenSearch-User-Id` header  
- Extract backend roles from `X-OpenSearch-Backend-Roles` header
- Log the information using structured logging
- Print to console for easy visibility

## Testing

### Step 1: Restart Services

```bash
# Restart OpenSearch Dashboards to pick up code changes
docker-compose restart opensearch-dashboards

# Restart opensearch-agent-server to pick up code changes
docker-compose restart opensearch-agent-server
```

### Step 2: Test Directly (Optional)

Test that the server receives and logs the username:

```bash
./test_username_header.sh
```

You should see in the opensearch-agent-server logs:
```
============================================================
🔵 CHAT REQUEST FROM USER: pete
   User ID: pete
   Roles: kibana_user,readall,product_manager
   Thread ID: test-thread-123
   Run ID: test-run-456
============================================================
```

### Step 3: Test via OpenSearch Dashboards

1. **Log into OpenSearch Dashboards** at http://localhost:5601
   - Username: `pete` or `rumi`
   - Password: `MyStr0ng!P@ssw0rd2024`

2. **Open the chat interface** (usually in the top-right corner or navigation)

3. **Send a message** in the chat

4. **Check the logs**:
   ```bash
   docker-compose logs -f opensearch-agent-server
   ```

You should see output like:
```
============================================================
🔵 CHAT REQUEST FROM USER: pete
   User ID: pete
   Roles: kibana_user,readall,product_manager
   Thread ID: thread-1234567890-abc
   Run ID: run-1234567890-xyz
============================================================
```

## What Gets Logged

When a user sends a chat message, the opensearch-agent-server logs:

- **Username**: The OpenSearch Dashboards username (e.g., "pete", "rumi")
- **User ID**: The user's ID (often same as username)
- **Backend Roles**: Comma-separated list of roles (e.g., "kibana_user,readall,product_manager")
- **Thread ID**: The conversation thread identifier
- **Run ID**: The specific run/request identifier

## Using the Username in Your Code

You can now access the username in any route handler:

```python
@app.post("/runs")
async def create_run(request: Request, ...):
    username = request.headers.get('x-opensearch-user-name', 'unknown')
    backend_roles = request.headers.get('x-opensearch-backend-roles', '').split(',')
    
    # Implement role-based logic
    if 'product_manager' in backend_roles:
        # Read-only access
        pass
    elif 'relevance_engineer' in backend_roles:
        # Full access
        pass
    
    # Your logic here
```

## Troubleshooting

### Username shows as "unknown"

1. Check OpenSearch Dashboards logs:
   ```bash
   docker-compose logs opensearch-dashboards | grep "Chat request from user"
   ```

2. Verify the user is logged in (not using anonymous access)

3. Check that the security plugin is enabled in OpenSearch Dashboards

### No logs appearing

1. Verify opensearch-agent-server is running:
   ```bash
   docker-compose ps opensearch-agent-server
   ```

2. Check for errors in startup:
   ```bash
   docker-compose logs opensearch-agent-server | tail -50
   ```

3. Verify the chat is configured correctly in `opensearch_dashboards.yml`:
   ```yaml
   chat:
     enabled: true
     agUiUrl: "http://opensearch-agent-server:8001/runs"
   ```

## Next Steps

Now that you have the username, you can:

1. **Implement access control** based on user roles
2. **Log user actions** for audit trails
3. **Personalize responses** based on user identity
4. **Filter data** based on user permissions
5. **Track usage** per user for analytics

See `auth_middleware_example.py` for examples of implementing role-based access control.
