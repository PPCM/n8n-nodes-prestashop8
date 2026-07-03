# UI Integration Tests — n8n PrestaShop 8

## Overview

These tests validate the PrestaShop 8 n8n node by executing real API calls through n8n Docker against a live PrestaShop instance. They complement the 183 unit tests (Jest) which only validate in-memory code structure.

## Prerequisites

- **n8n Docker** running via `n8n-docker-test/` (see CLAUDE.md)
- **PrestaShop 8 instance** accessible (configured in n8n credentials)
- **Python 3.x** installed (uses only stdlib — no pip dependencies)
- n8n credential "PrestaShop 8 account" already configured
- Project built: `pnpm run build`

## Quick Start

```bash
# 1. Build the project
pnpm run build

# 2. Start n8n Docker
cd n8n-docker-test && docker compose up -d && cd ..

# 3. Run integration tests
python3 tests/ui/run-integration-tests.py
```

## Test Script

### `run-integration-tests.py`

Automated test runner that:

1. Logs into n8n REST API (cookie auth)
2. Creates a temporary workflow with the PrestaShop 8 node
3. For each of the 33 resources, tests:
   - **List all** — Retrieves all items, verifies non-empty response
   - **Get by ID** — Fetches a single item using an ID from List
   - **Search** — Filters by id using customFilter
4. Reports pass/fail per resource/operation
5. Saves results to `integration-test-results.json`

### Configuration

The script uses hardcoded n8n connection settings at the top of the file:

| Variable | Description |
|----------|-------------|
| `N8N_URL` | n8n instance URL (default: `http://127.0.0.1:5678`) |
| `N8N_EMAIL` | n8n login email |
| `N8N_PASSWORD` | n8n login password |
| `WORKFLOW_ID` | Workflow ID to use for testing |
| `API_KEY` | n8n API key (for execution result retrieval) |
| `CREDENTIAL_ID` | PrestaShop credential ID in n8n |

**Important**: Before running, you must create a workflow in n8n and update `WORKFLOW_ID`, or the script will create one via API.

## Resource Coverage (33 resources)

### Full CRUD tested (List + GetById + Search + Create + Update + Delete)
customers, addresses, groups, customer_threads, customer_messages, products, combinations, categories, manufacturers, suppliers, tags, product_features, product_options, orders, order_states, order_carriers, carts, cart_rules, carriers, zones, countries, states, currencies, taxes, content_management_system, languages, shops

### Limited operations
| Resource | Operations |
|----------|-----------|
| stock_availables | List, GetById, Search, Update |
| order_details | List, GetById, Search, Update |
| order_histories | List, GetById, Search, Create |
| configurations | List, GetById, Search, Update |
| images | List, Search (special ID format) |

### Not implemented
| Resource | Reason |
|----------|--------|
| guests | Not available in node description |

## Test Results Format

Results are saved as JSON in `integration-test-results.json`:

```json
{
  "timestamp": "2026-02-12T10:10:54",
  "total_pass": 92,
  "total_fail": 3,
  "total_skip": 4,
  "results": {
    "customers": {
      "list": {"passed": true, "message": "51 items"},
      "getById": {"passed": true, "message": "Got item #1"},
      "search": {"passed": true, "message": "Found 1 item(s) matching id=1"}
    }
  }
}
```

## Transversal Tests

### Display Custom
Tested via API: `display: 'custom', customFields: '[id,name,price]'` on Products.
Verifies only the 3 requested fields are returned.

### CRUD Operations
Create/Update/Delete tested programmatically on:
- **customers** (create with firstname/lastname/email/passwd, update firstname, delete)
- **manufacturers** (create with name, update active, delete)
- **zones** (create with name/active, update name, delete)
- **categories** (create with name/parentId/link_rewrite, update, delete)
- **order_histories** (create only — no update/delete)
- **stock_availables** (update only — no create/delete)
- **configurations** (update only — no create/delete)

## Troubleshooting

- **"Could not get parameter"**: Resource may not exist in node description
- **"Empty result"**: PrestaShop table is empty (e.g., tags) — not a bug
- **"Workflow has issues"**: Some resources (images) use special ID formats
- **Timeout**: Increase `time.sleep()` in the script for slow PrestaShop instances
