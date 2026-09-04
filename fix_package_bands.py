"""
Fix package capability bands:
1. Recalibrate EP ranges for updated (lower) micro-appliance EP values
2. Fix variant code assignments (HL-2/HL-3 and PP-1/PP-2/PP-3 were wrong)

EP ranges reduced ~20% to account for WiFi 2.0->0.5, Decoder 1.0->0.6,
Phone 1.0->0.3, Alarm 1.5->0.6, CCTV 2.0->1.1, etc.
PP ranges unchanged (PP values didn't change).
"""
import json, urllib.request

BASE = "https://taqon-backend.onrender.com/api/v1"

# Login
login_data = json.dumps({"email": "admin@taqon.co.zw", "password": "TaqonAdmin2026"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login/", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["tokens"]["access"]
print("Logged in OK")

# Get all packages
req = urllib.request.Request(f"{BASE}/solar-config/admin/packages/", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
pkgs = data if isinstance(data, list) else data.get("results", data)
slug_map = {}
for p in pkgs:
    slug_map[p["name"]] = p["slug"]
    # Also map by panel count + kVA for precise matching
    key = f"{p.get('inverter_kva', '0')}_{p.get('panel_count', 0)}"
    if key not in slug_map:
        slug_map[key] = p["slug"]

print(f"Got {len(pkgs)} packages")

# CORRECTED capability bands with recalibrated EP ranges
# EP reduced ~20-25% from original PDF values to match updated micro-appliance EPs
BANDS = {
    # Home Economy (3kVA Must) — same, small loads unaffected much
    "HE-1": {"name_match": "economy", "pp_min": "0", "pp_max": "3.2", "ep_min": "0", "ep_max": "2.5",
             "variant_code": "HE-1", "inverter_brand": "must", "smart_load_supported": False,
             "recharge_class": "basic", "comfort_class": "budget", "management_tolerance": "high"},

    # Home Luxury — Growatt (HL-1, HL-2, HL-3)
    "HL-1": {"name_match": "luxury 1.0", "pp_min": "2.8", "pp_max": "4.8", "ep_min": "2.0", "ep_max": "4.5",
             "variant_code": "HL-1", "inverter_brand": "growatt", "smart_load_supported": False,
             "recharge_class": "basic", "comfort_class": "budget", "management_tolerance": "high"},
    "HL-2": {"name_match": "luxury 1.1", "pp_min": "3.2", "pp_max": "5.2", "ep_min": "2.5", "ep_max": "5.5",
             "variant_code": "HL-2", "inverter_brand": "growatt", "smart_load_supported": False,
             "recharge_class": "moderate", "comfort_class": "budget", "management_tolerance": "high"},
    "HL-3": {"name_match": "luxury 1.2", "pp_min": "4.0", "pp_max": "6.2", "ep_min": "4.5", "ep_max": "8.0",
             "variant_code": "HL-3", "inverter_brand": "growatt", "smart_load_supported": False,
             "recharge_class": "moderate", "comfort_class": "balanced", "management_tolerance": "medium"},

    # Home Luxury — Sunsynk (HL-4, HL-5, HL-6)
    "HL-4": {"name_match": "luxury 2.0", "pp_min": "3.5", "pp_max": "5.8", "ep_min": "2.5", "ep_max": "5.5",
             "variant_code": "HL-4", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "moderate", "comfort_class": "balanced", "management_tolerance": "medium"},
    "HL-5": {"name_match": "luxury 2.1", "pp_min": "4.5", "pp_max": "6.8", "ep_min": "5.0", "ep_max": "8.5",
             "variant_code": "HL-5", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "balanced", "management_tolerance": "medium"},
    "HL-6": {"name_match": "luxury performance", "pp_min": "5.5", "pp_max": "7.8", "ep_min": "7.0", "ep_max": "11.0",
             "variant_code": "HL-6", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "premium", "management_tolerance": "low"},

    # Home Deluxe (8kVA Sunsynk)
    "HD-1": {"name_match": "delux 2.0", "pp_min": "6.5", "pp_max": "8.8", "ep_min": "6.0", "ep_max": "10.0",
             "variant_code": "HD-1", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "budget", "management_tolerance": "medium"},
    "HD-2": {"name_match": "deluxe 2.1", "pp_min": "7.0", "pp_max": "9.5", "ep_min": "8.0", "ep_max": "12.0",
             "variant_code": "HD-2", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "balanced", "management_tolerance": "medium"},
    "HD-3": {"name_match": "delux v2.2", "pp_min": "8.0", "pp_max": "10.8", "ep_min": "10.0", "ep_max": "15.0",
             "variant_code": "HD-3", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "balanced", "management_tolerance": "low"},
    "HD-4": {"name_match": "delux performance", "pp_min": "9.0", "pp_max": "11.8", "ep_min": "12.0", "ep_max": "17.0",
             "variant_code": "HD-4", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "premium", "management_tolerance": "low"},

    # Ultra Power (10kVA Sunsynk)
    "UP-1": {"name_match": "ultra power v2.0", "pp_min": "9.5", "pp_max": "12.2", "ep_min": "8.0", "ep_max": "12.0",
             "variant_code": "UP-1", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "budget", "management_tolerance": "medium"},
    "UP-2": {"name_match": "ultra power v2.1", "pp_min": "10.5", "pp_max": "13.2", "ep_min": "10.5", "ep_max": "15.5",
             "variant_code": "UP-2", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "balanced", "management_tolerance": "low"},
    "UP-3": {"name_match": "ultra power performance", "pp_min": "11.5", "pp_max": "14.5", "ep_min": "14.0", "ep_max": "20.0",
             "variant_code": "UP-3", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "premium", "comfort_class": "premium", "management_tolerance": "low"},

    # Premium Power 1P (12kVA Sunsynk)
    "PP-1": {"name_match": "premuim power 1.0", "pp_min": "12.0", "pp_max": "14.8", "ep_min": "8.0", "ep_max": "13.0",
             "variant_code": "PP-1", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "budget", "management_tolerance": "medium"},
    "PP-2": {"name_match": "premium power 1.1", "pp_min": "13.0", "pp_max": "16.2", "ep_min": "11.5", "ep_max": "17.0",
             "variant_code": "PP-2", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "balanced", "management_tolerance": "low"},
    "PP-3": {"name_match": "premium power v1 performance", "pp_min": "14.0", "pp_max": "17.5", "ep_min": "15.5", "ep_max": "23.0",
             "variant_code": "PP-3", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "premium", "comfort_class": "premium", "management_tolerance": "low"},

    # Pro Power (16kVA Sunsynk)
    "PRO-1": {"name_match": "pro power 1.0", "pp_min": "17.0", "pp_max": "20.5", "ep_min": "12.5", "ep_max": "18.0",
              "variant_code": "PRO-1", "inverter_brand": "sunsynk", "smart_load_supported": True,
              "recharge_class": "balanced", "comfort_class": "budget", "management_tolerance": "medium"},
    "PRO-2": {"name_match": "pro power 1.1", "pp_min": "18.0", "pp_max": "21.5", "ep_min": "15.5", "ep_max": "21.0",
              "variant_code": "PRO-2", "inverter_brand": "sunsynk", "smart_load_supported": True,
              "recharge_class": "strong", "comfort_class": "balanced", "management_tolerance": "low"},
    "PRO-3": {"name_match": "pro power v1.2", "pp_min": "20.0", "pp_max": "23.5", "ep_min": "18.5", "ep_max": "26.0",
              "variant_code": "PRO-3", "inverter_brand": "sunsynk", "smart_load_supported": True,
              "recharge_class": "strong", "comfort_class": "premium", "management_tolerance": "low"},
    "PRO-4": {"name_match": "pro power performance", "pp_min": "21.0", "pp_max": "24.5", "ep_min": "22.0", "ep_max": "30.0",
              "variant_code": "PRO-4", "inverter_brand": "sunsynk", "smart_load_supported": True,
              "recharge_class": "premium", "comfort_class": "premium", "management_tolerance": "low"},

    # Master Power (20kVA Sunsynk)
    "MP-1": {"name_match": "master power v1.0", "pp_min": "23.0", "pp_max": "26.5", "ep_min": "17.0", "ep_max": "25.0",
             "variant_code": "MP-1", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "balanced", "comfort_class": "budget", "management_tolerance": "medium"},
    "MP-2": {"name_match": "master power v1.2", "pp_min": "25.0", "pp_max": "29.0", "ep_min": "22.0", "ep_max": "31.0",
             "variant_code": "MP-2", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "strong", "comfort_class": "balanced", "management_tolerance": "low"},
    "MP-3": {"name_match": "master power v1.3", "pp_min": "27.0", "pp_max": "31.0", "ep_min": "28.0", "ep_max": "38.0",
             "variant_code": "MP-3", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "premium", "comfort_class": "premium", "management_tolerance": "low"},
    "MP-4": {"name_match": "master power performance", "pp_min": "29.0", "pp_max": "32.0", "ep_min": "34.0", "ep_max": "45.0",
             "variant_code": "MP-4", "inverter_brand": "sunsynk", "smart_load_supported": True,
             "recharge_class": "premium", "comfort_class": "premium", "management_tolerance": "low"},
}

# Match each band entry to a package by name
updated = 0
for code, band in BANDS.items():
    match_str = band.pop("name_match").lower()

    # Find package by name match
    matched_pkg = None
    for p in pkgs:
        if match_str in p["name"].lower():
            matched_pkg = p
            break

    if not matched_pkg:
        print(f"  SKIP {code}: no package matching '{match_str}'")
        continue

    slug = matched_pkg["slug"]
    url = f"{BASE}/solar-config/admin/packages/{slug}/"
    payload = json.dumps(band).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            updated += 1
            print(f"  {code} -> {matched_pkg['name'][:40]}")
    except Exception as e:
        print(f"  FAILED {code} ({matched_pkg['name']}): {e}")

print(f"\nUpdated {updated}/{len(BANDS)} packages")
