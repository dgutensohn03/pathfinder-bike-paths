"""Build a small, reviewable Front Range catalog from DRCOG's public GIS service.

Run: python scripts/import_trails.py
This is a build-time snapshot. The website makes no third-party data requests.
"""
import collections
import datetime
import json
import pathlib
import urllib.parse
import urllib.request

BASE = "https://services.arcgis.com/rD2ylXRs80UroD90/ArcGIS/rest/services/DRCOG_Corridors_Data_Compilation_for_Analysis_WFL1/FeatureServer/102"
NAMES = [
    "CHERRY CREEK TRAIL", "SOUTH PLATTE RIVER TRAIL", "HIGHLINE CANAL TRAIL",
    "CLEAR CREEK TRAIL", "BIG DRY CREEK TRAIL", "C-470 BIKEWAY",
    "US-36 BIKEWAY", "C-470 TRAIL", "BEAR CREEK TRAIL",
    "RALSTON CREEK TRAIL", "PINEY CREEK TRAIL", "HIGH PLAINS TRAIL",
    "LITTLE DRY CREEK TRAIL", "WESTERLY CREEK TRAIL",
    "SAND CREEK GREENWAY TRAIL", "TOLL GATE CREEK TRAIL",
    "FARMERS' HIGH LINE CANAL TRAIL", "BRANTNER GULCH TRAIL",
    "BOULDER CREEK PATH", "CHATFIELD DAM TRAIL", "EAST PLUM CREEK TRAIL",
    "WILLOW CREEK TRAIL", "VAN BIBBER CREEK TRAIL", "WEIR GULCH TRAIL",
    "COAL CREEK TRAIL", "EAST-WEST TRAIL", "COLUMBINE TRAIL",
    "ROCKY MOUNTAIN WILDLIFE REFUGE TRAIL", "WATERTON CANYON TRAIL",
    "DAVIDSON MESA TRAIL",
]


def request(params):
    url = BASE + "/query?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=45) as response:
        data = json.load(response)
    if "error" in data:
        raise RuntimeError(data["error"])
    return data


def simplify(points, tolerance=0.000075):
    """Douglas-Peucker, with a small visual tolerance for a preview map."""
    if len(points) <= 2:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    squared = dx * dx + dy * dy
    def distance(p):
        t = max(0, min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / squared)) if squared else 0
        return ((p[0]-a[0]-t*dx)**2 + (p[1]-a[1]-t*dy)**2)**0.5
    index = max(range(1, len(points)-1), key=lambda i: distance(points[i]))
    if distance(points[index]) <= tolerance:
        return [a, b]
    return simplify(points[:index+1], tolerance)[:-1] + simplify(points[index:], tolerance)


def main():
    quoted = ",".join("'" + n.replace("'", "''") + "'" for n in NAMES)
    common = {
        "where": f"status='EXISTING' AND on_off='OFF-STREET' AND fac_type IN ('SHARED USE PATH','UNPAVED PATH') AND name IN ({quoted})",
        "geometry": "-105.35,39.35,-104.65,40.05",
        "geometryType": "esriGeometryEnvelope", "inSR": "4326", "outSR": "4326",
        "outFields": "FID,name,surface,len_ft", "returnGeometry": "true", "f": "geojson",
        "resultRecordCount": "500", "orderByFields": "FID ASC",
    }
    features = []
    while True:
        page = request({**common, "resultOffset": str(len(features))})
        part = page.get("features", [])
        features.extend(part)
        print(f"Fetched {len(features)} segments", flush=True)
        if len(part) < 500:
            break
    grouped = collections.defaultdict(list)
    for feature in features:
        props = feature.get("properties") or {}
        if feature.get("geometry", {}).get("type") in ("LineString", "MultiLineString"):
            grouped[props["name"]].append(feature)
    output = []
    for name in NAMES:
        records = grouped[name]
        if not records:
            raise RuntimeError(f"No mapped segments for {name}; review catalog selection")
        lines, surfaces = [], collections.Counter()
        for feature in records:
            geo = feature["geometry"]
            parts = [geo["coordinates"]] if geo["type"] == "LineString" else geo["coordinates"]
            for part in parts:
                if len(part) >= 2:
                    # 5 decimals retain roughly metre scale and keep the snapshot compact.
                    lines.append(simplify([[round(p[0], 5), round(p[1], 5)] for p in part]))
            surfaces[str(feature["properties"].get("surface") or "UNKNOWN").upper()] += max(0, feature["properties"].get("len_ft") or 0)
        points = [p for line in lines for p in line]
        bounds = [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]
        center = [round((bounds[1] + bounds[3]) / 2, 5), round((bounds[0] + bounds[2]) / 2, 5)]
        length = sum(max(0, f["properties"].get("len_ft") or 0) for f in records) / 5280
        total_surface = sum(surfaces.values())
        major_share = max(surfaces.values()) / total_surface if total_surface else 1
        dominant = "Mixed" if major_share < 0.65 else max(surfaces, key=surfaces.get).title()
        output.append({
            "id": name.lower().replace("'", "").replace(" ", "-"),
            "name": name.title().replace("Us-36", "US-36").replace("C-470", "C-470"),
            "miles": round(length, 1), "point": center,
            "surface": dominant,
            "surfaceMix": {k.title(): round(v / 5280, 1) for k, v in sorted(surfaces.items())},
            "segmentCount": len(records), "geometry": {"type": "MultiLineString", "coordinates": lines},
        })
    snapshot = {
        "source": BASE, "attribution": "Denver Regional Council of Governments (DRCOG)",
        "updated": datetime.date.today().isoformat(), "scope": "Selected named, existing off-street shared-use paths within a Front Range bounding box",
        "distanceNote": "Mapped segment sum within the study area; may include branches or gaps and is not an end-to-end ride distance.",
        "trails": output,
    }
    target = pathlib.Path(__file__).resolve().parents[1] / "data" / "trails.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(snapshot, separators=(",", ":")) + "\n")
    print(f"Wrote {len(output)} paths to {target} ({target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
