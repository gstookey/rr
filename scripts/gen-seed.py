"""Generate ACME Workshop's seed data. EVERYTHING here is invented.

The bounding box is deliberately in the middle of a large land mass at a
latitude/longitude that is farmland and small roads — chosen so that no
coordinate resolves to a real facility, port, base or airfield. Names are
invented; the two manufacturers, the B2B operator, the product lines and the
serial prefixes exist nowhere.
"""
from pathlib import Path
import json, os, random

random.seed(20260904)  # deterministic: the same seed must produce the same file
ROOT = str(Path(__file__).resolve().parent.parent / "services" / "gateway" / "seed")
os.makedirs(ROOT, exist_ok=True)

# An invented land-only box: interior farmland, roughly 120 km across.
BOX = {"minLat": 39.10, "maxLat": 40.20, "minLon": -98.90, "maxLon": -97.40}

def pos():
    return {
        "lat": round(random.uniform(BOX["minLat"], BOX["maxLat"]), 5),
        "lon": round(random.uniform(BOX["minLon"], BOX["maxLon"]), 5),
    }

def marking(level, comps):
    return {"level": level, "compartments": comps}

manufacturers = [
    {"id": "mfr-ttw", "code": "TTW", "name": "Tick-Tock Watchworks",
     "groupPath": "/ttw", "marking": marking("INTERNAL", ["TTW"])},
    {"id": "mfr-mer", "code": "MER", "name": "Meridian Wearables",
     "groupPath": "/mer", "marking": marking("INTERNAL", ["MER"])},
]

operators = [
    {"id": "op-nwl", "code": "TTW/NWL", "name": "Northwind Logistics",
     "kind": "b2b-customer", "customerOf": "mfr-ttw", "groupPath": "/ttw/nwl",
     "marking": marking("PARTNER", ["TTW/NWL"])},
]

# Six products across the two manufacturers. The spec sheet is an ATTRIBUTE BAG
# (Boundary Test rung 1): MER's fitness line carries fitness.* keys that TTW's
# products simply do not have, and no schema anywhere knows about them.
products = [
    {"id": "prd-ttw-chrono-1", "manufacturerId": "mfr-ttw", "name": "Chrono One",
     "deviceClass": "wearable", "lifecycle": "published",
     "specs": {"case.diameterMm": 42, "battery.hours": 96, "display.type": "amoled"},
     "marking": marking("INTERNAL", ["TTW"])},
    {"id": "prd-ttw-chrono-2", "manufacturerId": "mfr-ttw", "name": "Chrono Two",
     "deviceClass": "wearable", "lifecycle": "published",
     "specs": {"case.diameterMm": 44, "battery.hours": 120, "display.type": "amoled",
               "radio.lte": True},
     "marking": marking("INTERNAL", ["TTW"])},
    {"id": "prd-ttw-fieldmark", "manufacturerId": "mfr-ttw", "name": "Fieldmark Rugged",
     "deviceClass": "wearable", "lifecycle": "published",
     "specs": {"case.diameterMm": 47, "battery.hours": 240, "ingress.rating": "IP68"},
     "marking": marking("INTERNAL", ["TTW"])},
    {"id": "prd-mer-pulse-1", "manufacturerId": "mfr-mer", "name": "Pulse Track",
     "deviceClass": "fitness", "lifecycle": "published",
     "specs": {"case.diameterMm": 40, "battery.hours": 72,
               "fitness.heartRateSensor": "optical-v3", "fitness.spo2": True,
               "fitness.strideCalibration": "auto"},
     "marking": marking("INTERNAL", ["MER"])},
    {"id": "prd-mer-pulse-2", "manufacturerId": "mfr-mer", "name": "Pulse Track Pro",
     "deviceClass": "fitness", "lifecycle": "published",
     "specs": {"case.diameterMm": 43, "battery.hours": 84,
               "fitness.heartRateSensor": "optical-v4", "fitness.spo2": True,
               "fitness.vo2Max": True},
     "marking": marking("INTERNAL", ["MER"])},
    {"id": "prd-mer-tidewalk", "manufacturerId": "mfr-mer", "name": "Tidewalk",
     "deviceClass": "fitness", "lifecycle": "draft",
     "specs": {"case.diameterMm": 41, "battery.hours": 60,
               "fitness.heartRateSensor": "optical-v3", "fitness.swimStroke": True},
     "marking": marking("RESTRICTED", ["MER"])},
]

FIRMWARE = ["4.1.2", "4.2.0", "4.2.1", "5.0.0"]
HEALTH = ["nominal", "nominal", "nominal", "degraded", "fault", "unknown"]
LIFECYCLE = ["registered", "provisioned", "in-service", "in-service", "in-service"]

devices = []
def make_devices(prefix, product_id, owner, operator, count, start, mark):
    for i in range(count):
        serial = f"{prefix}-{start + i:05d}"
        online = random.random() > 0.18
        d = {
            "id": f"dev-{serial.lower()}",
            "serial": serial,
            "productId": product_id,
            "ownerGroup": owner,
            "operatorGroup": operator,
            "firmware": random.choice(FIRMWARE),
            "lifecycle": random.choice(LIFECYCLE),
            "health": random.choice(HEALTH),
            "online": online,
            "lastSeenMinutesAgo": random.randint(0, 4) if online else random.randint(60, 20000),
            "position": pos(),
            "marking": mark,
        }
        devices.append(d)

ttw_int = marking("INTERNAL", ["TTW"])
mer_int = marking("INTERNAL", ["MER"])
nwl_part = marking("PARTNER", ["TTW/NWL"])

# ~120 devices total: 80 TTW-operated, 40 operated by Northwind (the B2B customer).
make_devices("TTW", "prd-ttw-chrono-1", "/ttw", "/ttw", 34, 10001, ttw_int)
make_devices("TTW", "prd-ttw-chrono-2", "/ttw", "/ttw", 26, 20001, ttw_int)
make_devices("MER", "prd-mer-pulse-1", "/mer", "/mer", 12, 30001, mer_int)
make_devices("MER", "prd-mer-pulse-2", "/mer", "/mer", 8, 40001, mer_int)
# Northwind operates 40 TTW devices: owned by TTW, operated by /ttw/nwl, and
# marked with the SUB-compartment — this is the row set Fay may see and Ada's
# colleagues at Meridian may not.
make_devices("TTW", "prd-ttw-fieldmark", "/ttw", "/ttw/nwl", 40, 50001, nwl_part)

campaigns = [
    {"id": "cmp-ttw-fw-420", "manufacturerId": "mfr-ttw", "name": "Chrono One firmware 4.2.0",
     "payloadKind": "software-update", "payloadRef": "fw-4.2.0",
     "targetSelector": {"productId": "prd-ttw-chrono-1"},
     "approvalProcess": [{"step": 1, "role": "release-approver", "commentRequired": False}],
     "approvalsGranted": 1, "state": "dispatched", "vector": "server-push",
     "marking": ttw_int},
    {"id": "cmp-mer-fw-500", "manufacturerId": "mfr-mer", "name": "Pulse Track Pro firmware 5.0.0",
     "payloadKind": "software-update", "payloadRef": "fw-5.0.0",
     "targetSelector": {"productId": "prd-mer-pulse-2"},
     "approvalProcess": [{"step": 1, "role": "release-approver", "commentRequired": False},
                         {"step": 2, "role": "group-admin", "commentRequired": True}],
     "approvalsGranted": 1, "state": "awaiting-approval", "vector": "server-push",
     "marking": mer_int},
    {"id": "cmp-ttw-feature-tide", "manufacturerId": "mfr-ttw", "name": "Activate Tidal Almanac",
     "payloadKind": "feature-activation", "payloadRef": "feat-tidal-almanac",
     "targetSelector": {"operatorGroup": "/ttw/nwl"},
     "approvalProcess": [{"step": 1, "role": "release-approver", "commentRequired": False}],
     "approvalsGranted": 0, "state": "draft", "vector": "sms",
     "marking": nwl_part},
]

entitlements = [
    {"id": "ent-nwl-tidal", "deviceGroup": "/ttw/nwl", "feature": "feat-tidal-almanac",
     "paidUntil": "2027-01-31", "marking": nwl_part},
]

vectors = [
    {"id": "vec-ttw-server", "manufacturerId": "mfr-ttw", "kind": "server-push",
     "enabled": True, "priority": 1, "marking": ttw_int},
    {"id": "vec-ttw-sms", "manufacturerId": "mfr-ttw", "kind": "sms",
     "enabled": True, "priority": 2, "marking": ttw_int},
    {"id": "vec-mer-server", "manufacturerId": "mfr-mer", "kind": "server-push",
     "enabled": True, "priority": 1, "marking": mer_int},
    {"id": "vec-mer-email", "manufacturerId": "mfr-mer", "kind": "email",
     "enabled": False, "priority": 3, "marking": mer_int},
]

HEADER = ("EVERYTHING IN THIS FILE IS INVENTED. No real manufacturer, person, "
          "product, serial, marking string or facility appears here, and the "
          "coordinates fall inside an invented land-only bounding box chosen so "
          "that no point resolves to a real site. That is what makes this repo "
          "portable across the fence. Generated by scripts/gen-seed (deterministic, "
          "seed 20260904); edit the generator, not the output.")

def dump(name, payload):
    payload = {"$comment": HEADER, **payload}
    with open(os.path.join(ROOT, name), "w") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")

dump("tenants.json", {"boundingBox": BOX, "manufacturers": manufacturers, "operators": operators})
dump("products.json", {"products": products})
dump("devices.json", {"devices": devices})
dump("campaigns.json", {"campaigns": campaigns, "distributionVectors": vectors,
                        "entitlements": entitlements})

print("devices:", len(devices), "products:", len(products), "campaigns:", len(campaigns))
