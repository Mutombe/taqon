"""
Apply taqon_zim_calibrated_v2.xlsx values:
1. Update all appliance PP/EP/Concurrency/NightUse
2. Update all package PP/EP ranges
"""
import json, urllib.request

BASE = "https://taqon-backend.onrender.com/api/v1"

# Login
login_data = json.dumps({"email": "admin@taqon.co.zw", "password": "TaqonAdmin2026"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login/", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["tokens"]["access"]
print("Logged in OK")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def patch(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method="PATCH", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.status

# ========================================
# PART 1: UPDATE APPLIANCES
# ========================================
print("\n=== UPDATING APPLIANCES ===")

# Get slug map
req = urllib.request.Request(f"{BASE}/solar-config/appliances/", headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
items = data if isinstance(data, list) else data.get("results", data)
slug_map = {a["name"]: a["slug"] for a in items}

# From API Update Values sheet in taqon_zim_calibrated_v2.xlsx
APPLIANCE_UPDATES = {
    "LED Light": {"power_points":"0.1","energy_points":"0.15","concurrency_factor":"0.8","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":10},
    "Lights Group (5-10)": {"power_points":"0.5","energy_points":"1","concurrency_factor":"0.7","night_use_factor":"0.85","smart_load_eligible":False,"typical_wattage":80},
    "TV (Small)": {"power_points":"0.5","energy_points":"0.7","concurrency_factor":"0.6","night_use_factor":"0.65","smart_load_eligible":False,"typical_wattage":80},
    "Home Theatre": {"power_points":"1","energy_points":"1","concurrency_factor":"0.4","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":200},
    "Decoder": {"power_points":"0.15","energy_points":"0.3","concurrency_factor":"0.8","night_use_factor":"0.65","smart_load_eligible":False,"typical_wattage":30},
    "Gaming Console": {"power_points":"1","energy_points":"0.7","concurrency_factor":"0.5","night_use_factor":"0.55","smart_load_eligible":False,"typical_wattage":200},
    "Projector": {"power_points":"1.5","energy_points":"0.8","concurrency_factor":"0.3","night_use_factor":"0.45","smart_load_eligible":False,"typical_wattage":300},
    "WiFi Router": {"power_points":"0.1","energy_points":"0.4","concurrency_factor":"1","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":12},
    "Laptop": {"power_points":"0.4","energy_points":"0.3","concurrency_factor":"0.5","night_use_factor":"0.3","smart_load_eligible":False,"typical_wattage":65},
    "Desktop Computer": {"power_points":"1.5","energy_points":"2.2","concurrency_factor":"0.5","night_use_factor":"0.3","smart_load_eligible":False,"typical_wattage":300},
    "Phone Chargers": {"power_points":"0.1","energy_points":"0.2","concurrency_factor":"0.7","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":25},
    "Fridge": {"power_points":"1.5","energy_points":"2.1","concurrency_factor":"0.45","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":150},
    "Deep Freezer": {"power_points":"1.5","energy_points":"2.6","concurrency_factor":"0.35","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":200},
    "Under-counter Fridge": {"power_points":"0.8","energy_points":"1.4","concurrency_factor":"0.5","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":100},
    "Ice Maker": {"power_points":"1","energy_points":"1","concurrency_factor":"0.4","night_use_factor":"0.3","smart_load_eligible":False,"typical_wattage":200},
    "Microwave": {"power_points":"4","energy_points":"0.25","concurrency_factor":"0.18","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":1200},
    "Kettle": {"power_points":"5","energy_points":"0.15","concurrency_factor":"0.1","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Toaster": {"power_points":"2.5","energy_points":"0.1","concurrency_factor":"0.1","night_use_factor":"0.05","smart_load_eligible":False,"typical_wattage":800},
    "Electric Frying Pan": {"power_points":"4","energy_points":"0.5","concurrency_factor":"0.15","night_use_factor":"0.15","smart_load_eligible":False,"typical_wattage":1500},
    "Blender": {"power_points":"1.5","energy_points":"0.1","concurrency_factor":"0.1","night_use_factor":"0.05","smart_load_eligible":False,"typical_wattage":500},
    "Coffee Machine": {"power_points":"2.5","energy_points":"0.2","concurrency_factor":"0.15","night_use_factor":"0.05","smart_load_eligible":False,"typical_wattage":1000},
    "Electric Stove Plate": {"power_points":"8","energy_points":"1.5","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Electric Oven": {"power_points":"10","energy_points":"2","concurrency_factor":"0.15","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":3000},
    "Dishwasher": {"power_points":"3","energy_points":"0.8","concurrency_factor":"0.2","night_use_factor":"0.08","smart_load_eligible":True,"typical_wattage":1800},
    "Washing Machine": {"power_points":"2.5","energy_points":"0.3","concurrency_factor":"0.25","night_use_factor":"0.1","smart_load_eligible":True,"typical_wattage":500},
    "Tumble Dryer": {"power_points":"7","energy_points":"1.5","concurrency_factor":"0.15","night_use_factor":"0.05","smart_load_eligible":True,"typical_wattage":3000},
    "Iron": {"power_points":"4","energy_points":"0.5","concurrency_factor":"0.15","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Hair Dryer": {"power_points":"4","energy_points":"0.2","concurrency_factor":"0.1","night_use_factor":"0.05","smart_load_eligible":False,"typical_wattage":1800},
    "Borehole Pump": {"power_points":"6","energy_points":"0.1","concurrency_factor":"0.2","night_use_factor":"0.03","smart_load_eligible":True,"typical_wattage":1500},
    "Booster Pump (Small)": {"power_points":"2.5","energy_points":"0.3","concurrency_factor":"0.3","night_use_factor":"0.15","smart_load_eligible":True,"typical_wattage":750},
    "Pool Pump": {"power_points":"3","energy_points":"0.2","concurrency_factor":"0.15","night_use_factor":"0.03","smart_load_eligible":True,"typical_wattage":1100},
    "Filtration System": {"power_points":"2","energy_points":"0.3","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":True,"typical_wattage":500},
    "Water Purifier": {"power_points":"0.3","energy_points":"0.2","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":50},
    "Garden Irrigation": {"power_points":"0.5","energy_points":"0.1","concurrency_factor":"0.2","night_use_factor":"0.05","smart_load_eligible":True,"typical_wattage":50},
    "AC 9000 BTU": {"power_points":"5","energy_points":"4.5","concurrency_factor":"0.4","night_use_factor":"0.5","smart_load_eligible":True,"typical_wattage":900},
    "AC 18000 BTU": {"power_points":"8","energy_points":"8","concurrency_factor":"0.4","night_use_factor":"0.5","smart_load_eligible":True,"typical_wattage":1800},
    "Ceiling Fan": {"power_points":"0.4","energy_points":"0.7","concurrency_factor":"0.7","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":75},
    "Pedestal Fan": {"power_points":"0.3","energy_points":"0.6","concurrency_factor":"0.7","night_use_factor":"0.6","smart_load_eligible":False,"typical_wattage":55},
    "Electric Heater": {"power_points":"7","energy_points":"6","concurrency_factor":"0.5","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":2000},
    "Geyser (Electric)": {"power_points":"10","energy_points":"7","concurrency_factor":"0.4","night_use_factor":"0.2","smart_load_eligible":True,"typical_wattage":3000},
    "Solar Geyser Booster": {"power_points":"0.5","energy_points":"0.5","concurrency_factor":"0.8","night_use_factor":"0.5","smart_load_eligible":False,"typical_wattage":100},
    "CCTV System": {"power_points":"0.5","energy_points":"2","concurrency_factor":"1","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":50},
    "Alarm System": {"power_points":"0.3","energy_points":"1.5","concurrency_factor":"1","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":30},
    "Gate Motor": {"power_points":"3","energy_points":"0.05","concurrency_factor":"0.08","night_use_factor":"0.08","smart_load_eligible":False,"typical_wattage":500},
    "Garage Door Motor": {"power_points":"3","energy_points":"0.05","concurrency_factor":"0.08","night_use_factor":"0.08","smart_load_eligible":False,"typical_wattage":500},
    "Electric Fence": {"power_points":"0.5","energy_points":"1","concurrency_factor":"1","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":30},
    "Printer (Small)": {"power_points":"1","energy_points":"0.5","concurrency_factor":"0.3","night_use_factor":"0.2","smart_load_eligible":False,"typical_wattage":300},
    "Photocopier": {"power_points":"3","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":1500},
    "Server / NAS": {"power_points":"2","energy_points":"4","concurrency_factor":"1","night_use_factor":"1","smart_load_eligible":False,"typical_wattage":300},
    "POS System": {"power_points":"1","energy_points":"2","concurrency_factor":"1","night_use_factor":"0.8","smart_load_eligible":False,"typical_wattage":100},
    "Workshop Tools": {"power_points":"2","energy_points":"1","concurrency_factor":"0.3","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":800},
    "Angle Grinder": {"power_points":"4","energy_points":"1","concurrency_factor":"0.2","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":2000},
    "Welder": {"power_points":"10","energy_points":"2","concurrency_factor":"0.1","night_use_factor":"0.1","smart_load_eligible":False,"typical_wattage":5000},
    "Security Lights": {"power_points":"0.5","energy_points":"2.5","concurrency_factor":"0.6","night_use_factor":"0.9","smart_load_eligible":False,"typical_wattage":100},
}

a_updated = 0
for name, vals in APPLIANCE_UPDATES.items():
    slug = slug_map.get(name)
    if not slug:
        print(f"  SKIP: {name}")
        continue
    try:
        patch(f"{BASE}/solar-config/admin/appliances/{slug}/", vals)
        a_updated += 1
    except Exception as e:
        print(f"  FAIL: {name} - {e}")

print(f"Updated {a_updated}/{len(APPLIANCE_UPDATES)} appliances")

# ========================================
# PART 2: UPDATE PACKAGE RANGES
# ========================================
print("\n=== UPDATING PACKAGE RANGES ===")

# From Package Matrix sheet - exact slug -> ranges
PKG_UPDATES = {
    "home-economy-3kva": {"variant_code":"HE-1","pp_min":"0","pp_max":"3.5","ep_min":"0","ep_max":"3.5","inverter_brand":"must","smart_load_supported":False,"recharge_class":"basic","comfort_class":"budget","management_tolerance":"high"},
    "home-luxury-1-0-5kva": {"variant_code":"HL-1","pp_min":"1.5","pp_max":"5","ep_min":"2","ep_max":"5","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"basic","comfort_class":"budget","management_tolerance":"high"},
    "home-luxury-1-1-5kva": {"variant_code":"HL-2","pp_min":"2","pp_max":"5.5","ep_min":"2.5","ep_max":"5.5","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"moderate","comfort_class":"balanced","management_tolerance":"high"},
    "home-luxury-1-2-5kva": {"variant_code":"HL-3","pp_min":"3.5","pp_max":"6.5","ep_min":"4.5","ep_max":"8.5","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "home-luxury-2-0-5kva": {"variant_code":"HL-4","pp_min":"1.5","pp_max":"6","ep_min":"2","ep_max":"5.5","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"moderate","comfort_class":"balanced","management_tolerance":"medium"},
    "home-luxury-2-1-5kva": {"variant_code":"HL-5","pp_min":"3.5","pp_max":"7","ep_min":"4","ep_max":"9","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "home-luxury-performance-5kva": {"variant_code":"HL-6","pp_min":"4","pp_max":"7.5","ep_min":"6","ep_max":"11","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},
    "home-delux-2-0-8kva": {"variant_code":"HD-1","pp_min":"5.5","pp_max":"9","ep_min":"5","ep_max":"9","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "home-deluxe-2-1-8kva": {"variant_code":"HD-2","pp_min":"6","pp_max":"10","ep_min":"7","ep_max":"12","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "home-delux-v2-2-8kva": {"variant_code":"HD-3","pp_min":"7","pp_max":"11","ep_min":"9","ep_max":"15","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},
    "home-delux-performance-8kva": {"variant_code":"HD-4","pp_min":"8","pp_max":"11.5","ep_min":"12","ep_max":"20","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "ultra-power-v2-0-10kva": {"variant_code":"UP-1","pp_min":"8.5","pp_max":"13","ep_min":"7","ep_max":"12","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "ultra-power-v2-1-10kva": {"variant_code":"UP-2","pp_min":"9.5","pp_max":"14","ep_min":"10","ep_max":"16","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},
    "ultra-power-performance-10kva": {"variant_code":"UP-3","pp_min":"10","pp_max":"14.5","ep_min":"14","ep_max":"22","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "premuim-power-1-0-12kva": {"variant_code":"PP-1","pp_min":"11","pp_max":"16","ep_min":"7","ep_max":"12","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"high"},
    "premium-power-1-1-12kva": {"variant_code":"PP-2","pp_min":"12","pp_max":"17","ep_min":"12","ep_max":"18","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "premium-power-v1-performance-12kva": {"variant_code":"PP-3","pp_min":"13","pp_max":"18","ep_min":"16","ep_max":"24","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "premium-power-2-0-12kva": {"variant_code":"PP-4","pp_min":"11","pp_max":"16","ep_min":"7","ep_max":"12","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"high"},
    "premium-power-2-1-12kva": {"variant_code":"PP-5","pp_min":"12","pp_max":"17","ep_min":"12","ep_max":"18","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "premium-power-v2-performance-12kva": {"variant_code":"PP-6","pp_min":"13","pp_max":"18","ep_min":"16","ep_max":"24","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "pro-power-1-0": {"variant_code":"PRO-1","pp_min":"15","pp_max":"21","ep_min":"12","ep_max":"18","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "pro-power-1-1": {"variant_code":"PRO-2","pp_min":"16","pp_max":"22","ep_min":"16","ep_max":"24","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "pro-power-v1-2": {"variant_code":"PRO-3","pp_min":"18","pp_max":"25","ep_min":"20","ep_max":"32","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},
    "pro-power-performance": {"variant_code":"PRO-4","pp_min":"19","pp_max":"26","ep_min":"26","ep_max":"40","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "master-power-v1-0": {"variant_code":"MP-1","pp_min":"20","pp_max":"30","ep_min":"16","ep_max":"24","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "master-power-v1-2": {"variant_code":"MP-2","pp_min":"22","pp_max":"34","ep_min":"22","ep_max":"34","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"medium"},
    "master-power-v1-3": {"variant_code":"MP-3","pp_min":"24","pp_max":"38","ep_min":"30","ep_max":"44","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "master-power-performance": {"variant_code":"MP-4","pp_min":"28","pp_max":"45","ep_min":"40","ep_max":"65","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
}

p_updated = 0
for slug, vals in PKG_UPDATES.items():
    try:
        patch(f"{BASE}/solar-config/admin/packages/{slug}/", vals)
        p_updated += 1
        print(f"  OK: {vals['variant_code']} -> {slug}")
    except Exception as e:
        print(f"  FAIL: {slug} - {e}")

print(f"Updated {p_updated}/{len(PKG_UPDATES)} packages")
print("\nDONE - All Zimbabwe calibration applied")
