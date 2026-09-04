"""Update all appliance PP/EP/Concurrency/NightUse to match PDF Table A exactly."""
import json, urllib.request, sys

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
print(f"Got {len(slug_map)} appliances")

# PDF Table A exact values
PDF = {
    "LED Light":            {"power_points":"0.2","energy_points":"0.5","concurrency_factor":"0.8","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":10},
    "Lights Group (5-10)":  {"power_points":"1","energy_points":"3","concurrency_factor":"0.8","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":100},
    "TV (Small)":           {"power_points":"1","energy_points":"2","concurrency_factor":"0.6","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":100},
    "Home Theatre":         {"power_points":"1","energy_points":"1.5","concurrency_factor":"0.4","night_use_factor":"0.7","smart_load_eligible":False,"typical_wattage":200},
    "WiFi Router":          {"power_points":"0.3","energy_points":"2","concurrency_factor":"1.0","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":15},
    "Laptop":               {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.5","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":65},
    "Desktop Computer":     {"power_points":"1","energy_points":"2","concurrency_factor":"0.6","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":300},
    "Phone Chargers":       {"power_points":"0.2","energy_points":"1","concurrency_factor":"0.7","night_use_factor":"0.7","smart_load_eligible":False,"typical_wattage":25},
    "Fridge":               {"power_points":"2","energy_points":"3","concurrency_factor":"0.6","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":150},
    "Deep Freezer":         {"power_points":"2","energy_points":"3","concurrency_factor":"0.5","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":200},
    "Microwave":            {"power_points":"4","energy_points":"1","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":1200},
    "Kettle":               {"power_points":"5","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Toaster":              {"power_points":"3","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":800},
    "Electric Frying Pan":  {"power_points":"4","energy_points":"2","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":1500},
    "Blender":              {"power_points":"2","energy_points":"0.5","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":500},
    "Coffee Machine":       {"power_points":"2","energy_points":"1","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":1000},
    "Washing Machine":      {"power_points":"3","energy_points":"2","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":500},
    "Dishwasher":           {"power_points":"3","energy_points":"2","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":1800},
    "Iron":                 {"power_points":"3","energy_points":"2","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":2000},
    "Hair Dryer":           {"power_points":"4","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":1800},
    "Booster Pump (Small)": {"power_points":"3","energy_points":"1.5","concurrency_factor":"0.5","night_use_factor":"0.3","smart_load_eligible":True,"typical_wattage":750},
    "Borehole Pump":        {"power_points":"6","energy_points":"2","concurrency_factor":"0.4","night_use_factor":"0.1","smart_load_eligible":True,"typical_wattage":1500},
    "Pool Pump":            {"power_points":"3","energy_points":"2","concurrency_factor":"0.3","night_use_factor":"0.1","smart_load_eligible":True,"typical_wattage":1100},
    "AC 9000 BTU":          {"power_points":"6","energy_points":"4","concurrency_factor":"0.6","night_use_factor":"0.5","smart_load_eligible":True,"typical_wattage":900},
    "AC 18000 BTU":         {"power_points":"8","energy_points":"5","concurrency_factor":"0.6","night_use_factor":"0.5","smart_load_eligible":True,"typical_wattage":1800},
    "Ceiling Fan":          {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.7","night_use_factor":"0.7","smart_load_eligible":False,"typical_wattage":75},
    "Pedestal Fan":         {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.7","night_use_factor":"0.7","smart_load_eligible":False,"typical_wattage":55},
    "Electric Heater":      {"power_points":"7","energy_points":"6","concurrency_factor":"0.5","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":2000},
    "Electric Stove Plate": {"power_points":"8","energy_points":"5","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":2000},
    "Electric Oven":        {"power_points":"10","energy_points":"6","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":3000},
    "Geyser (Electric)":    {"power_points":"10","energy_points":"7","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":3000},
    "Solar Geyser Booster": {"power_points":"0.5","energy_points":"0.5","concurrency_factor":"0.8","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":100},
    "CCTV System":          {"power_points":"0.5","energy_points":"2","concurrency_factor":"1.0","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":50},
    "Alarm System":         {"power_points":"0.3","energy_points":"1.5","concurrency_factor":"1.0","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":30},
    "Gate Motor":           {"power_points":"4","energy_points":"0.5","concurrency_factor":"0.1","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":500},
    "Garage Door Motor":    {"power_points":"4","energy_points":"0.5","concurrency_factor":"0.1","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":500},
    "Electric Fence":       {"power_points":"0.5","energy_points":"1","concurrency_factor":"1.0","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":30},
    "Printer (Small)":      {"power_points":"1","energy_points":"0.5","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":300},
    "Photocopier":          {"power_points":"3","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":1500},
    "Server / NAS":         {"power_points":"2","energy_points":"4","concurrency_factor":"1.0","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":300},
    "POS System":           {"power_points":"1","energy_points":"2","concurrency_factor":"1.0","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":100},
    "Filtration System":    {"power_points":"2","energy_points":"2","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":500},
    "Water Purifier":       {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":50},
    "Under-counter Fridge": {"power_points":"1","energy_points":"2","concurrency_factor":"0.7","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":100},
    "Ice Maker":            {"power_points":"2","energy_points":"2","concurrency_factor":"0.5","night_use_factor":"0.4","smart_load_eligible":False,"typical_wattage":200},
    "Tumble Dryer":         {"power_points":"7","energy_points":"5","concurrency_factor":"0.3","night_use_factor":"0.1","smart_load_eligible":True,"typical_wattage":3000},
    "Gaming Console":       {"power_points":"1","energy_points":"2","concurrency_factor":"0.6","night_use_factor":"0.7","smart_load_eligible":False,"typical_wattage":200},
    "Projector":            {"power_points":"1","energy_points":"2","concurrency_factor":"0.4","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":300},
    "Security Lights":      {"power_points":"1","energy_points":"3","concurrency_factor":"0.6","night_use_factor":"1.0","smart_load_eligible":False,"typical_wattage":100},
    "Garden Irrigation":    {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":50},
    "Workshop Tools":       {"power_points":"2","energy_points":"1","concurrency_factor":"0.3","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":800},
    "Angle Grinder":        {"power_points":"4","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Welder":               {"power_points":"10","energy_points":"2","concurrency_factor":"0.1","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":5000},
    "Decoder":              {"power_points":"0.3","energy_points":"1","concurrency_factor":"0.8","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":30},
}

updated = 0
failed = 0
for name, values in PDF.items():
    slug = slug_map.get(name)
    if not slug:
        print(f"  SKIP (not in DB): {name}")
        continue
    url = f"{BASE}/solar-config/admin/appliances/{slug}/"
    data = json.dumps(values).encode()
    req = urllib.request.Request(url, data=data, method="PATCH", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            updated += 1
    except Exception as e:
        print(f"  FAILED: {name} - {e}")
        failed += 1

print(f"\nUpdated {updated}/{len(PDF)} appliances. Failed: {failed}")

# Verify with the PDF example
print("\n=== VERIFICATION: PDF Example (page 26) ===")
print("Lights x2, TV x2, Fridge x1, Borehole x1, WiFi x1")
print("Formula: Base_PP = PP * Concurrency * Qty")
print("Formula: Base_EP = EP * NightUse * Qty\n")

test = [
    ("Lights Group (5-10)", 2),
    ("TV (Small)", 2),
    ("Fridge", 1),
    ("Borehole Pump", 1),
    ("WiFi Router", 1),
]

total_pp = 0
total_ep = 0
for name, qty in test:
    v = PDF[name]
    pp = float(v["power_points"])
    ep = float(v["energy_points"])
    conc = float(v["concurrency_factor"])
    night = float(v["night_use_factor"])
    bpp = pp * conc * qty
    bep = ep * night * qty
    total_pp += bpp
    total_ep += bep
    print(f"  {name} x{qty}: PP={pp}*{conc}*{qty}={bpp:.1f}  EP={ep}*{night}*{qty}={bep:.1f}")

print(f"\n  Total PP = {total_pp:.1f}")
print(f"  Total EP = {total_ep:.1f}")
