"""Update appliance EP values from the proposed updated EP first pass document."""
import json, urllib.request

BASE = "https://taqon-backend.onrender.com/api/v1"

# Login
login_data = json.dumps({"email": "admin@taqon.co.zw", "password": "TaqonAdmin2026"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login/", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["tokens"]["access"]
print("Logged in OK")

# Get slug map
req = urllib.request.Request(f"{BASE}/solar-config/appliances/", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
items = data if isinstance(data, list) else data.get("results", data)
slug_map = {a["name"]: a["slug"] for a in items}

# Proposed EP updates from the document
EP_UPDATES = {
    "WiFi Router": "0.5",
    "Decoder": "0.6",
    "Phone Chargers": "0.3",
    "Alarm System": "0.6",
    "Electric Fence": "0.8",
    "CCTV System": "1.1",       # midpoint of 1.0-1.2
    "Laptop": "0.9",
    "Desktop Computer": "1.5",
    "Printer (Small)": "0.3",
    "Gate Motor": "0.2",
    "Garage Door Motor": "0.2",
    "Server / NAS": "3.5",      # midpoint of 3-4
    "POS System": "1.0",
}

updated = 0
for name, new_ep in EP_UPDATES.items():
    slug = slug_map.get(name)
    if not slug:
        print(f"  SKIP (not found): {name}")
        continue
    url = f"{BASE}/solar-config/admin/appliances/{slug}/"
    payload = json.dumps({"energy_points": new_ep}).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            updated += 1
            print(f"  {name}: EP -> {new_ep}")
    except Exception as e:
        print(f"  FAILED: {name} - {e}")

print(f"\nUpdated {updated}/{len(EP_UPDATES)} appliances")
