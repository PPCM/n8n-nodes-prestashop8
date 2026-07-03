#!/usr/bin/env python3
"""
n8n Health Check Script
Verifies: n8n accessible, login works, PrestaShop 8 node loaded.
"""

import json
import os
import sys
import urllib.request
import http.cookiejar

# Credentials are read from the environment to avoid committing secrets.
N8N_URL = os.environ.get("N8N_URL", "http://127.0.0.1:5678")
N8N_EMAIL = os.environ.get("N8N_EMAIL", "")
N8N_PASSWORD = os.environ.get("N8N_PASSWORD", "")
if not N8N_EMAIL or not N8N_PASSWORD:
    sys.exit("N8N_EMAIL and N8N_PASSWORD environment variables are required")


def check_n8n_accessible():
    """Check if n8n is responding."""
    print("1. n8n accessible...", end=" ")
    try:
        req = urllib.request.Request(N8N_URL)
        resp = urllib.request.urlopen(req, timeout=5)
        print(f"OK (HTTP {resp.status})")
        return True
    except Exception as e:
        print(f"FAIL ({e})")
        return False


def check_login():
    """Check if login works and return cookie jar."""
    print("2. Login...", end=" ")
    cj = http.cookiejar.MozillaCookieJar("/tmp/n8n-health-cookies.txt")
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    try:
        data = json.dumps({
            "emailOrLdapLoginId": N8N_EMAIL,
            "password": N8N_PASSWORD,
        }).encode("utf-8")
        req = urllib.request.Request(f"{N8N_URL}/rest/login", data=data, method="POST")
        req.add_header("Content-Type", "application/json; charset=utf-8")
        resp = opener.open(req, timeout=10)
        result = json.loads(resp.read().decode())
        user = result.get("data", {})
        print(f"OK (user: {user.get('firstName', '?')} {user.get('lastName', '?')})")
        cj.save(ignore_discard=True)
        return cj, opener
    except Exception as e:
        print(f"FAIL ({e})")
        return None, None


def check_prestashop_node(opener):
    """Check if PrestaShop 8 node is loaded by listing workflows that use it."""
    print("3. PrestaShop 8 node...", end=" ")
    try:
        # Check node availability by verifying we can list workflows
        # and that the community package is installed
        req = urllib.request.Request(f"{N8N_URL}/rest/community-packages")
        req.add_header("Content-Type", "application/json; charset=utf-8")
        resp = opener.open(req, timeout=10)
        result = json.loads(resp.read().decode())
        packages = result.get("data", result) if isinstance(result, dict) else result
        if isinstance(packages, list):
            for pkg in packages:
                name = pkg.get("packageName", "") if isinstance(pkg, dict) else ""
                if "prestashop" in name.lower():
                    print(f"OK (package: {name})")
                    return True
        # Fallback: check if workflows reference the node type
        req2 = urllib.request.Request(f"{N8N_URL}/rest/workflows")
        req2.add_header("Content-Type", "application/json; charset=utf-8")
        resp2 = opener.open(req2, timeout=10)
        result2 = json.loads(resp2.read().decode())
        wfs = result2.get("data", [])
        if isinstance(wfs, dict):
            wfs = wfs.get("data", [])
        for wf in wfs:
            wf_id = wf.get("id", "")
            req3 = urllib.request.Request(f"{N8N_URL}/rest/workflows/{wf_id}")
            req3.add_header("Content-Type", "application/json; charset=utf-8")
            resp3 = opener.open(req3, timeout=10)
            full_wf = json.loads(resp3.read().decode())
            wf_data = full_wf.get("data", full_wf)
            for node in wf_data.get("nodes", []):
                if node.get("type") == "CUSTOM.prestaShop8":
                    print(f"OK (found in workflow '{wf_data.get('name')}')")
                    return True
        print("FAIL (node not found in any workflow)")
        return False
    except Exception as e:
        print(f"FAIL ({e})")
        return False


def check_credentials(opener):
    """Check if PrestaShop 8 credentials exist."""
    print("4. PrestaShop credentials...", end=" ")
    try:
        req = urllib.request.Request(f"{N8N_URL}/rest/credentials")
        req.add_header("Content-Type", "application/json; charset=utf-8")
        resp = opener.open(req, timeout=10)
        result = json.loads(resp.read().decode())
        creds = result.get("data", [])
        ps_cred = None
        for cred in creds:
            if cred.get("type") == "prestaShop8Api":
                ps_cred = cred
                break
        if ps_cred:
            print(f"OK (name: {ps_cred.get('name')}, id: {ps_cred.get('id')})")
            return True
        else:
            print("FAIL (no prestaShop8Api credential found)")
            return False
    except Exception as e:
        print(f"FAIL ({e})")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("n8n PrestaShop 8 Health Check")
    print("=" * 50)

    ok = check_n8n_accessible()
    if not ok:
        print("\nn8n is not accessible. Start it with:")
        print("  cd n8n-docker-test && docker compose up -d")
        sys.exit(1)

    cj, opener = check_login()
    if not opener:
        sys.exit(1)

    node_ok = check_prestashop_node(opener)
    cred_ok = check_credentials(opener)

    print("\n" + "=" * 50)
    all_ok = ok and cj and node_ok and cred_ok
    if all_ok:
        print("All checks PASSED - ready for integration tests")
    else:
        print("Some checks FAILED - fix issues before running tests")
    sys.exit(0 if all_ok else 1)
