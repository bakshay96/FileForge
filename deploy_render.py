"""
FileForge — Render.com Automated Deployment Script
─────────────────────────────────────────────────────────────────────────────
Automates Render Web Service creation, environment variable setup, and deploy
triggering via the Render REST API (https://api.render.com/v1).
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import httpx

# Ensure UTF-8 output encoding on Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

API_BASE = "https://api.render.com/v1"

def get_api_key() -> str:
    key = os.environ.get("RENDER_API_KEY")
    if not key:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith("RENDER_API_KEY="):
                        key = line.strip().split("=", 1)[1].strip('"').strip("'")
                        break
    if not key:
        print("[ERROR] RENDER_API_KEY is missing.")
        print("Please add RENDER_API_KEY=rnd_xxx to backend/.env")
        sys.exit(1)
    return key

def main():
    api_key = get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    client = httpx.Client(headers=headers, timeout=30.0)

    print("[INFO] Fetching Render services...")
    res = client.get(f"{API_BASE}/services?limit=20")
    if res.status_code != 200:
        print(f"[ERROR] Failed to connect to Render API ({res.status_code}): {res.text}")
        sys.exit(1)

    services = res.json()
    backend_service = None

    for item in services:
        svc = item.get("service", {})
        if svc.get("name") == "fileforge-backend" or "fileforge" in svc.get("name", ""):
            backend_service = svc
            break

    if backend_service:
        service_id = backend_service["id"]
        service_name = backend_service["name"]
        service_url = backend_service.get("serviceDetails", {}).get("url")
        print(f"[OK] Found existing service '{service_name}' (ID: {service_id})")
    else:
        print("[INFO] Creating new Web Service 'fileforge-backend' on Render...")
        payload = {
            "type": "web_service",
            "name": "fileforge-backend",
            "ownerId": services[0]["service"]["ownerId"] if services else "",
            "repo": "https://github.com/bakshay96/FileForge",
            "autoDeploy": "yes",
            "serviceDetails": {
                "env": "python",
                "envSpecificDetails": {
                    "buildCommand": "pip install --upgrade pip setuptools wheel && pip install -r requirements.txt",
                    "startCommand": "python run.py",
                },
                "region": "singapore",
                "plan": "free",
                "rootDir": "backend",
            },
        }
        res = client.post(f"{API_BASE}/services", json=payload)
        if res.status_code not in (200, 201):
            print(f"[ERROR] Service creation failed ({res.status_code}): {res.text}")
            sys.exit(1)

        svc = res.json().get("service", {})
        service_id = svc["id"]
        service_name = svc["name"]
        service_url = svc.get("serviceDetails", {}).get("url")
        print(f"[SUCCESS] Service created! ID: {service_id}")

    # Set Environment Variables
    print("[INFO] Updating environment variables...")
    env_vars = [
        {"key": "PYTHON_VERSION", "value": "3.11.9"},
        {"key": "APP_NAME", "value": "FileForge"},
        {"key": "DEBUG", "value": "false"},
        {"key": "MONGO_URI", "value": "mongodb+srv://akshaymaliedu_db_user:akshay@cluster0.o9hauwk.mongodb.net/?appName=FileForge"},
        {"key": "MONGO_DB_NAME", "value": "fileforge"},
        {"key": "JWT_SECRET", "value": "fileforge-prod-secret-2026"},
        {"key": "TMP_DIR", "value": "/tmp"},
        {"key": "MAX_FILE_SIZE_MB", "value": "20"},
        {"key": "CORS_ORIGINS", "value": "*"},
    ]
    
    res = client.put(f"{API_BASE}/services/{service_id}/env-vars", json=env_vars)
    if res.status_code == 200:
        print("[OK] Environment variables configured.")
    else:
        print(f"[WARN] Environment variables response ({res.status_code}): {res.text}")

    # Trigger Deploy
    print("[INFO] Triggering fresh deployment...")
    res = client.post(f"{API_BASE}/services/{service_id}/deploys")
    if res.status_code in (200, 201):
        deploy_info = res.json()
        deploy_id = deploy_info.get("id")
        print(f"[SUCCESS] Deployment triggered! Deploy ID: {deploy_id}")
    else:
        print(f"[NOTE] Deploy trigger response ({res.status_code}): {res.text}")
        deploy_id = None

    if deploy_id:
        print("[INFO] Polling deployment status...")
        for _ in range(30):
            time.sleep(10)
            res = client.get(f"{API_BASE}/services/{service_id}/deploys/{deploy_id}")
            if res.status_code == 200:
                status_str = res.json().get("status")
                print(f"   Status: {status_str}")
                if status_str == "live":
                    print(f"\n🎉 DEPLOYMENT LIVE!")
                    print(f"🌐 Backend URL: {service_url}")
                    print(f"🔗 Health Check: {service_url}/api/health")
                    return
                elif status_str in ("build_failed", "deactivate_failed"):
                    print(f"\n❌ Deployment failed with status: {status_str}")
                    sys.exit(1)

    print(f"\n[COMPLETE] Deployment setup finished!")
    if service_url:
        print(f"🌐 Backend URL: {service_url}")
        print(f"🔗 Health Check: {service_url}/api/health")

if __name__ == "__main__":
    main()
