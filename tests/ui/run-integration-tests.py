#!/usr/bin/env python3
"""
n8n PrestaShop 8 Integration Test Runner
Tests all 33 resources via n8n REST API (List, GetById, Search operations).
Uses REST API (cookie auth) for execution, API v1 (key auth) for result retrieval.
"""

import json
import os
import sys
import time
import urllib.request
import http.cookiejar
from datetime import datetime

# ─── Configuration ───────────────────────────────────────────────────────────
# Credentials are read from the environment to avoid committing secrets.
N8N_URL = os.environ.get("N8N_URL", "http://127.0.0.1:5678")
N8N_EMAIL = os.environ.get("N8N_EMAIL", "")
N8N_PASSWORD = os.environ.get("N8N_PASSWORD", "")
if not N8N_EMAIL or not N8N_PASSWORD:
    sys.exit("N8N_EMAIL and N8N_PASSWORD environment variables are required")
# API key is read from the environment to avoid committing secrets.
API_KEY = os.environ.get("N8N_API_KEY", "")
if not API_KEY:
    sys.exit("N8N_API_KEY environment variable is required (n8n public API key)")

# Node IDs from the workflow
TRIGGER_NODE_ID = "a1f1aa63-1f9f-403e-bba5-94b25bd4be59"
TRIGGER_NODE_NAME = "When clicking Execute workflow"
PS_NODE_ID = "e3952f12-8a31-4b88-b2b4-585e41b76d6b"
PS_NODE_NAME = "PrestaShop8 Test"
CREDENTIAL_ID = "c2l4aKNiu9RHGaAU"
CREDENTIAL_NAME = "PrestaShop 8 account"

# All 33 resources with their capabilities
RESOURCES = {
    # CRM & Customers
    "customers": {"create": True, "update": True, "delete": True},
    "addresses": {"create": True, "update": True, "delete": True},
    "groups": {"create": True, "update": True, "delete": True},
    "customer_threads": {"create": True, "update": True, "delete": True},
    "customer_messages": {"create": True, "update": True, "delete": True},
    # Product Catalog
    "products": {"create": True, "update": True, "delete": True},
    "combinations": {"create": True, "update": True, "delete": True},
    "stock_availables": {"create": False, "update": True, "delete": False},
    "stock_movements": {"create": False, "update": False, "delete": False},
    "categories": {"create": True, "update": True, "delete": True},
    "manufacturers": {"create": True, "update": True, "delete": True},
    "suppliers": {"create": True, "update": True, "delete": True},
    "tags": {"create": True, "update": True, "delete": True},
    "product_features": {"create": True, "update": True, "delete": True},
    "product_options": {"create": True, "update": True, "delete": True},
    # Orders & Sales
    "orders": {"create": True, "update": True, "delete": True},
    "order_details": {"create": False, "update": True, "delete": False},
    "order_histories": {"create": True, "update": False, "delete": False},
    "order_states": {"create": True, "update": True, "delete": True},
    "order_carriers": {"create": True, "update": True, "delete": True},
    "carts": {"create": True, "update": True, "delete": True},
    "cart_rules": {"create": True, "update": True, "delete": True},
    "carriers": {"create": True, "update": True, "delete": True},
    "zones": {"create": True, "update": True, "delete": True},
    # Reference
    "countries": {"create": True, "update": True, "delete": True},
    "states": {"create": True, "update": True, "delete": True},
    # Finance
    "currencies": {"create": True, "update": True, "delete": True},
    "taxes": {"create": True, "update": True, "delete": True},
    # CMS & Media
    "content_management_system": {"create": True, "update": True, "delete": True},
    "images": {"create": True, "update": True, "delete": True},
    # Config
    "configurations": {"create": False, "update": True, "delete": False},
    "languages": {"create": True, "update": True, "delete": True},
    "shops": {"create": True, "update": True, "delete": True},
}


class N8nTestRunner:
    def __init__(self):
        self.cj = http.cookiejar.MozillaCookieJar("/tmp/n8n-test-cookies.txt")
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))
        self.results = {}
        self.total_pass = 0
        self.total_fail = 0
        self.total_skip = 0
        # ID of the disposable workflow created for the test run (Solution B).
        self.test_wf_id = None

    def rest_request(self, path, method="GET", data=None):
        """Make REST API request (cookie auth) to n8n."""
        url = f"{N8N_URL}{path}"
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, method=method)
        req.add_header("Content-Type", "application/json; charset=utf-8")
        try:
            resp = self.opener.open(req, timeout=60)
            return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if e.fp else str(e)
            return {"error": True, "status": e.code, "message": error_body[:500]}
        except Exception as e:
            return {"error": True, "message": str(e)}

    def v1_request(self, path):
        """Make API v1 request (API key auth) to n8n."""
        url = f"{N8N_URL}/api/v1{path}"
        req = urllib.request.Request(url)
        req.add_header("X-N8N-API-KEY", API_KEY)
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if e.fp else str(e)
            return {"error": True, "status": e.code, "message": error_body[:500]}
        except Exception as e:
            return {"error": True, "message": str(e)}

    def login(self):
        """Login to n8n and get session cookie."""
        print("Logging in to n8n...", end=" ")
        result = self.rest_request("/rest/login", "POST", {
            "emailOrLdapLoginId": N8N_EMAIL,
            "password": N8N_PASSWORD,
        })
        if "error" in result:
            print(f"FAILED: {result['message']}")
            sys.exit(1)
        self.cj.save(ignore_discard=True)
        print("OK")

    def build_workflow_data(self, resource, operation, extra_params=None):
        """Build workflow payload with given resource/operation."""
        params = {
            "resource": resource,
            "operation": operation,
            "advancedOptions": {},
            "options": {},
        }
        if extra_params:
            params.update(extra_params)

        return {
            "name": "__integration_test_temp__",
            "settings": {"executionOrder": "v1"},
            "nodes": [
                {
                    "parameters": {},
                    "type": "n8n-nodes-base.manualTrigger",
                    "typeVersion": 1,
                    "position": [0, 0],
                    "id": TRIGGER_NODE_ID,
                    "name": TRIGGER_NODE_NAME,
                },
                {
                    "parameters": params,
                    "type": "CUSTOM.prestaShop8",
                    "typeVersion": 2,
                    "position": [208, 0],
                    "id": PS_NODE_ID,
                    "name": PS_NODE_NAME,
                    "credentials": {
                        "prestaShop8Api": {
                            "id": CREDENTIAL_ID,
                            "name": CREDENTIAL_NAME,
                        }
                    },
                },
            ],
            "connections": {
                TRIGGER_NODE_NAME: {
                    "main": [[{"node": PS_NODE_NAME, "type": "main", "index": 0}]]
                }
            },
        }

    def setup_test_workflow(self):
        """Create the disposable workflow used to drive every test (Solution B)."""
        print("Creating disposable test workflow...", end=" ")
        wf_data = self.build_workflow_data("customers", "list")
        result = self.rest_request("/rest/workflows", "POST", wf_data)
        wf_id = result.get("data", {}).get("id") or result.get("id")
        if "error" in result or not wf_id:
            print(f"FAILED: {result.get('message', result)}")
            sys.exit(1)
        self.test_wf_id = wf_id
        print(f"OK (id: {wf_id})")

    def teardown_test_workflow(self):
        """Archive and delete the disposable workflow. Safe to call multiple times."""
        if not self.test_wf_id:
            return
        wf_id, self.test_wf_id = self.test_wf_id, None
        # n8n 2.23 requires a workflow to be archived before it can be deleted.
        self.rest_request(f"/rest/workflows/{wf_id}/archive", "POST", {})
        self.rest_request(f"/rest/workflows/{wf_id}", "DELETE")
        print(f"\nDisposable test workflow {wf_id} archived and deleted.")

    def execute_workflow(self, resource, operation, extra_params=None):
        """Update the disposable workflow's parameters, run it, return result items."""
        wf_data = self.build_workflow_data(resource, operation, extra_params)
        wf_id = self.test_wf_id

        # Persist the new resource/operation onto the disposable workflow.
        patch = self.rest_request(f"/rest/workflows/{wf_id}", "PATCH", wf_data)
        if "error" in patch:
            return None, f"Workflow update failed: {patch.get('message', 'Unknown error')}"

        # Run the persisted workflow. n8n 2.23 runs the saved workflow and
        # requires triggerToStartFrom to designate the starting trigger node.
        run_payload = {
            "workflowData": {"id": wf_id, **wf_data},
            "triggerToStartFrom": {
                "name": TRIGGER_NODE_NAME,
                "data": [[{"json": {}}]],
            },
        }
        result = self.rest_request(f"/rest/workflows/{wf_id}/run", "POST", run_payload)
        if "error" in result:
            return None, result.get("message", "Unknown error")

        exec_id = result.get("data", {}).get("executionId")
        if not exec_id:
            return None, f"No executionId: {json.dumps(result)[:200]}"

        # Wait for completion and get results via v1 API
        time.sleep(1)
        for attempt in range(20):
            exec_result = self.v1_request(f"/executions/{exec_id}?includeData=true")
            if "error" in exec_result:
                time.sleep(0.8)
                continue
            status = exec_result.get("status", "unknown")
            if status in ("success", "error", "crashed"):
                break
            time.sleep(0.8)
        else:
            return None, f"Timeout waiting for execution {exec_id}"

        if status != "success":
            # Try to extract error
            run_data = exec_result.get("data", {}).get("resultData", {}).get("runData", {})
            error_msg = f"Execution {status}"
            ps_runs = run_data.get(PS_NODE_NAME, [])
            if ps_runs and ps_runs[0].get("error"):
                err = ps_runs[0]["error"]
                error_msg = err.get("message", str(err))[:300]
            return None, error_msg

        # Extract output data from the PrestaShop node
        run_data = exec_result.get("data", {}).get("resultData", {}).get("runData", {})
        ps_runs = run_data.get(PS_NODE_NAME, [])
        if not ps_runs:
            return None, "No output from PrestaShop8 node"

        last_run = ps_runs[-1]
        if last_run.get("error"):
            err = last_run["error"]
            return None, err.get("message", str(err))[:300]

        main_output = last_run.get("data", {}).get("main", [[]])
        if main_output and main_output[0]:
            items = [item.get("json", {}) for item in main_output[0]]
            return items, None
        return [], None

    def test_list(self, resource):
        """Test List all operation. Returns (passed, message, first_id)."""
        items, error = self.execute_workflow(resource, "list")
        if error:
            return False, error, None
        if not items:
            return False, "Empty result", None
        first_item = items[0]
        if isinstance(first_item, dict):
            first_id = first_item.get("id")
        else:
            first_id = first_item  # Some resources return simple values
        return True, f"{len(items)} items", first_id

    def test_get_by_id(self, resource, item_id):
        """Test Get by ID operation."""
        items, error = self.execute_workflow(resource, "getById", {"id": str(item_id)})
        if error:
            return False, error
        if not items:
            return False, "Empty result"
        item = items[0] if isinstance(items, list) else items
        if isinstance(item, dict):
            returned_id = item.get("id")
            if str(returned_id) != str(item_id):
                return False, f"ID mismatch: expected {item_id}, got {returned_id}"
        return True, f"Got item #{item_id}"

    def test_search(self, resource, item_id):
        """Test Search operation with id filter."""
        # n8n fixedCollection format: use customFilter (free-text field name)
        filter_key = "customFilter"
        search_params = {
            "filters": {
                filter_key: [{
                    "field": "id",
                    "operator": "=",
                    "value": str(item_id),
                }]
            }
        }
        items, error = self.execute_workflow(resource, "search", search_params)
        if error:
            return False, error
        if not items:
            return False, "Empty result"
        # Handle items that may be strings (e.g. images resource)
        found_ids = []
        for item in items:
            if isinstance(item, dict):
                found_ids.append(str(item.get("id", "")))
            else:
                found_ids.append(str(item))
        if str(item_id) not in found_ids:
            return False, f"ID {item_id} not in results: {found_ids[:5]}"
        return True, f"Found {len(items)} item(s) matching id={item_id}"

    def record(self, resource, operation, passed, message):
        """Record test result."""
        symbol = "\u2705" if passed else "\u274c"
        if passed:
            self.total_pass += 1
        else:
            self.total_fail += 1
        print(f"  {symbol} {operation:12s} : {message}")
        if resource not in self.results:
            self.results[resource] = {}
        self.results[resource][operation] = {"passed": passed, "message": message}

    def record_skip(self, resource, operation, reason):
        """Record skipped test."""
        self.total_skip += 1
        print(f"  -- {operation:12s} : SKIP - {reason}")
        if resource not in self.results:
            self.results[resource] = {}
        self.results[resource][operation] = {"passed": None, "message": f"SKIP: {reason}"}

    def test_resource(self, resource, caps):
        """Run all applicable tests for a resource."""
        print(f"\n{'='*60}")
        print(f"Resource: {resource}")
        print(f"{'='*60}")

        # 1. List
        passed, msg, first_id = self.test_list(resource)
        self.record(resource, "list", passed, msg)

        if not passed or first_id is None:
            self.record_skip(resource, "getById", "No ID from list")
            self.record_skip(resource, "search", "No ID from list")
            return

        # 2. Get by ID
        passed, msg = self.test_get_by_id(resource, first_id)
        self.record(resource, "getById", passed, msg)

        # 3. Search
        passed, msg = self.test_search(resource, first_id)
        self.record(resource, "search", passed, msg)

    def run_all(self):
        """Run tests for all resources."""
        print("=" * 60)
        print(f"n8n PrestaShop 8 Integration Tests")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Resources to test: {len(RESOURCES)}")
        print("=" * 60)

        self.login()
        self.setup_test_workflow()

        try:
            for i, (resource, caps) in enumerate(RESOURCES.items(), 1):
                print(f"\n[{i}/{len(RESOURCES)}]", end="")
                self.test_resource(resource, caps)
        finally:
            self.teardown_test_workflow()

        # Summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        total = self.total_pass + self.total_fail
        print(f"Total tests: {total} (+ {self.total_skip} skipped)")
        print(f"Passed: {self.total_pass}")
        print(f"Failed: {self.total_fail}")
        if total > 0:
            print(f"Pass rate: {self.total_pass/total*100:.1f}%")

        # Show failures
        if self.total_fail > 0:
            print(f"\nFAILURES:")
            for resource, ops in self.results.items():
                for op, result in ops.items():
                    if result["passed"] is False:
                        print(f"  - {resource}/{op}: {result['message']}")

        # Save results
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_pass": self.total_pass,
            "total_fail": self.total_fail,
            "total_skip": self.total_skip,
            "results": self.results,
        }
        report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "integration-test-results.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\nResults saved to: {report_path}")

        return self.total_fail == 0


if __name__ == "__main__":
    runner = N8nTestRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)
