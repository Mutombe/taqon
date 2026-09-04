"""Fix ALL 28 package capability bands using exact slugs."""
import json, urllib.request

BASE = "https://taqon-backend.onrender.com/api/v1"

login_data = json.dumps({"email": "admin@taqon.co.zw", "password": "TaqonAdmin2026"}).encode()
req = urllib.request.Request(f"{BASE}/auth/login/", data=login_data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["tokens"]["access"]

# slug -> corrected bands (EP ranges recalibrated for updated micro-appliance EPs)
UPDATES = {
    "home-economy-3kva": {"variant_code":"HE-1","pp_min":"0","pp_max":"3.2","ep_min":"0","ep_max":"2.5","inverter_brand":"must","smart_load_supported":False,"recharge_class":"basic","comfort_class":"budget","management_tolerance":"high"},

    "home-luxury-1-0-5kva": {"variant_code":"HL-1","pp_min":"2.8","pp_max":"4.8","ep_min":"2.0","ep_max":"4.5","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"basic","comfort_class":"budget","management_tolerance":"high"},
    "home-luxury-1-1-5kva": {"variant_code":"HL-2","pp_min":"3.2","pp_max":"5.2","ep_min":"2.5","ep_max":"5.5","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"moderate","comfort_class":"budget","management_tolerance":"high"},
    "home-luxury-1-2-5kva": {"variant_code":"HL-3","pp_min":"4.0","pp_max":"6.2","ep_min":"4.5","ep_max":"8.0","inverter_brand":"growatt","smart_load_supported":False,"recharge_class":"moderate","comfort_class":"balanced","management_tolerance":"medium"},

    "home-luxury-2-0-5kva": {"variant_code":"HL-4","pp_min":"3.5","pp_max":"5.8","ep_min":"2.5","ep_max":"5.5","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"moderate","comfort_class":"balanced","management_tolerance":"medium"},
    "home-luxury-2-1-5kva": {"variant_code":"HL-5","pp_min":"4.5","pp_max":"6.8","ep_min":"5.0","ep_max":"8.5","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "home-luxury-performance-5kva": {"variant_code":"HL-6","pp_min":"5.5","pp_max":"7.8","ep_min":"7.0","ep_max":"11.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},

    "home-delux-2-0-8kva": {"variant_code":"HD-1","pp_min":"6.5","pp_max":"8.8","ep_min":"6.0","ep_max":"10.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "home-deluxe-2-1-8kva": {"variant_code":"HD-2","pp_min":"7.0","pp_max":"9.5","ep_min":"8.0","ep_max":"12.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"balanced","management_tolerance":"medium"},
    "home-delux-v2-2-8kva": {"variant_code":"HD-3","pp_min":"8.0","pp_max":"10.8","ep_min":"10.0","ep_max":"15.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "home-delux-performance-8kva": {"variant_code":"HD-4","pp_min":"9.0","pp_max":"11.8","ep_min":"12.0","ep_max":"17.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},

    "ultra-power-v2-0-10kva": {"variant_code":"UP-1","pp_min":"9.5","pp_max":"12.2","ep_min":"8.0","ep_max":"12.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "ultra-power-v2-1-10kva": {"variant_code":"UP-2","pp_min":"10.5","pp_max":"13.2","ep_min":"10.5","ep_max":"15.5","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "ultra-power-performance-10kva": {"variant_code":"UP-3","pp_min":"11.5","pp_max":"14.5","ep_min":"14.0","ep_max":"20.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},

    "premuim-power-1-0-12kva": {"variant_code":"PP-1","pp_min":"12.0","pp_max":"14.8","ep_min":"8.0","ep_max":"13.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "premium-power-1-1-12kva": {"variant_code":"PP-2","pp_min":"13.0","pp_max":"16.2","ep_min":"11.5","ep_max":"17.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "premium-power-v1-performance-1": {"variant_code":"PP-3","pp_min":"14.0","pp_max":"17.5","ep_min":"15.5","ep_max":"23.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},

    "premium-power-2-0-12kva": {"variant_code":"PP-4","pp_min":"12.0","pp_max":"14.8","ep_min":"8.0","ep_max":"13.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "premium-power-2-1-12kva": {"variant_code":"PP-5","pp_min":"13.0","pp_max":"16.2","ep_min":"11.5","ep_max":"17.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "premium-power-v2-performance-1": {"variant_code":"PP-6","pp_min":"14.0","pp_max":"17.5","ep_min":"15.5","ep_max":"23.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},

    "pro-power-1-0": {"variant_code":"PRO-1","pp_min":"17.0","pp_max":"20.5","ep_min":"12.5","ep_max":"18.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "pro-power-1-1": {"variant_code":"PRO-2","pp_min":"18.0","pp_max":"21.5","ep_min":"15.5","ep_max":"21.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "pro-power-v1-2": {"variant_code":"PRO-3","pp_min":"20.0","pp_max":"23.5","ep_min":"18.5","ep_max":"26.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"premium","management_tolerance":"low"},
    "pro-power-performance": {"variant_code":"PRO-4","pp_min":"21.0","pp_max":"24.5","ep_min":"22.0","ep_max":"30.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},

    "master-power-v1-0": {"variant_code":"MP-1","pp_min":"23.0","pp_max":"26.5","ep_min":"17.0","ep_max":"25.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"balanced","comfort_class":"budget","management_tolerance":"medium"},
    "master-power-v1-2": {"variant_code":"MP-2","pp_min":"25.0","pp_max":"29.0","ep_min":"22.0","ep_max":"31.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"strong","comfort_class":"balanced","management_tolerance":"low"},
    "master-power-v1-3": {"variant_code":"MP-3","pp_min":"27.0","pp_max":"31.0","ep_min":"28.0","ep_max":"38.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
    "master-power-performance": {"variant_code":"MP-4","pp_min":"29.0","pp_max":"32.0","ep_min":"34.0","ep_max":"45.0","inverter_brand":"sunsynk","smart_load_supported":True,"recharge_class":"premium","comfort_class":"premium","management_tolerance":"low"},
}

updated = 0
for slug, band in UPDATES.items():
    url = f"{BASE}/solar-config/admin/packages/{slug}/"
    payload = json.dumps(band).encode()
    req = urllib.request.Request(url, data=payload, method="PATCH", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            updated += 1
            print(f"  OK: {band['variant_code']} -> {slug}")
    except Exception as e:
        print(f"  FAIL: {band['variant_code']} ({slug}): {e}")

print(f"\nUpdated {updated}/{len(UPDATES)}")
