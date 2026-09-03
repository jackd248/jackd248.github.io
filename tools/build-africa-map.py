#!/usr/bin/env python3
"""Regenerate homework/quiz/assets/media/africa.svg from public-domain country outlines.

Source: johan/world.geo.json (MIT-licensed conversion of public-domain Natural Earth
data), https://github.com/johan/world.geo.json

Reads the item list and the map projection straight from africa.json, so the SVG
always stays in sync with the data set it belongs to. Path ids follow
`c-<lowercase item id>`, matching the ISO-3166-1 alpha-2 codes used as item ids.
"""

import json
import sys
import urllib.request
from pathlib import Path

GEOJSON_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = REPO_ROOT / "homework/quiz/assets/data/africa.json"
SVG_FILE = REPO_ROOT / "homework/quiz/assets/media/africa.svg"

# ISO-3166-1 alpha-2 (as used for item ids in africa.json) -> alpha-3
# (as used as GeoJSON feature ids in the source above).
ALPHA2_TO_ALPHA3 = {
    "eg": "EGY", "dz": "DZA", "ly": "LBY", "tn": "TUN",
    "ml": "MLI", "mr": "MRT", "ne": "NER", "sn": "SEN", "ci": "CIV", "ng": "NGA",
    "td": "TCD", "cm": "CMR", "cg": "COG", "cd": "COD", "cf": "CAF",
    "rw": "RWA", "et": "ETH", "ke": "KEN", "mg": "MDG", "so": "SOM", "tz": "TZA",
    "sd": "SDN", "ss": "SSD", "mu": "MUS",
    "bw": "BWA", "mz": "MOZ", "na": "NAM", "zm": "ZMB", "zw": "ZWE", "za": "ZAF", "ao": "AGO",
    "de": "DEU",
}

# Countries deliberately left without a path: too small in this simplified
# outline (Mauritius), or not part of the Africa map at all (the Germany
# reference row, per KONZEPT §8).
KNOWN_SKIPS = {"mu", "de"}

# All African sovereign states (ISO alpha-3), quiz items or not. Drawn as
# muted "context" background so the continent looks whole instead of
# patchy. A handful of small island states aren't in this simplified
# dataset at all (see KNOWN_CONTEXT_GAPS) and are silently skipped.
AFRICAN_ALPHA3 = {
    "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CMR", "CPV", "CAF", "TCD",
    "COM", "COG", "COD", "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH",
    "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
    "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA",
    "STP", "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA", "TGO",
    "TUN", "UGA", "ZMB", "ZWE", "ESH",
}
KNOWN_CONTEXT_GAPS = {"CPV", "COM", "MUS", "STP", "SYC"}


def project(lng, lat, projection):
    x = (lng - projection["lngMin"]) * projection["scale"]
    y = (projection["latMax"] - lat) * projection["scale"]
    return x, y


def ring_to_path(ring, projection):
    points = [project(lng, lat, projection) for lng, lat in ring]
    commands = [f"M{points[0][0]:.2f},{points[0][1]:.2f}"]
    commands += [f"L{x:.2f},{y:.2f}" for x, y in points[1:]]
    commands.append("Z")
    return " ".join(commands)


def geometry_to_path(geometry, projection):
    if geometry["type"] == "Polygon":
        rings = geometry["coordinates"]
    elif geometry["type"] == "MultiPolygon":
        rings = [ring for polygon in geometry["coordinates"] for ring in polygon]
    else:
        raise ValueError(f"unsupported geometry type: {geometry['type']}")
    return " ".join(ring_to_path(ring, projection) for ring in rings)


def main():
    africa = json.loads(DATA_FILE.read_text())
    projection = africa["map"]["projection"]
    if projection["type"] != "equirectangular":
        raise ValueError(f"unsupported projection: {projection['type']}")

    print(f"Fetching {GEOJSON_URL} ...", file=sys.stderr)
    with urllib.request.urlopen(GEOJSON_URL) as response:
        world = json.loads(response.read())
    features_by_alpha3 = {f["id"]: f for f in world["features"]}

    bounds = {"min_x": float("inf"), "min_y": float("inf"), "max_x": float("-inf"), "max_y": float("-inf")}

    def track_bounds(d):
        for token in d.replace("M", " ").replace("L", " ").replace("Z", "").split():
            x, y = (float(v) for v in token.split(","))
            bounds["min_x"], bounds["max_x"] = min(bounds["min_x"], x), max(bounds["max_x"], x)
            bounds["min_y"], bounds["max_y"] = min(bounds["min_y"], y), max(bounds["max_y"], y)

    context_paths = []
    quiz_alpha3 = set(ALPHA2_TO_ALPHA3.values())
    for alpha3 in sorted(AFRICAN_ALPHA3 - quiz_alpha3):
        feature = features_by_alpha3.get(alpha3)
        if feature is None:
            if alpha3 not in KNOWN_CONTEXT_GAPS:
                print(f"WARNING: no context geometry found for: {alpha3}", file=sys.stderr)
            continue
        d = geometry_to_path(feature["geometry"], projection)
        track_bounds(d)
        context_paths.append(f'  <path class="country context" d="{d}" />')

    quiz_paths = []
    skipped = []
    for item in africa["items"]:
        item_id = item["id"]
        if item_id in KNOWN_SKIPS:
            continue

        alpha3 = ALPHA2_TO_ALPHA3.get(item_id)
        feature = features_by_alpha3.get(alpha3) if alpha3 else None

        if feature is None:
            skipped.append(item_id)
            continue

        d = geometry_to_path(feature["geometry"], projection)
        track_bounds(d)
        quiz_paths.append(f'  <path class="country" id="{africa["map"]["pathIdPrefix"]}{item_id}" d="{d}" />')

    if skipped:
        print(f"WARNING: no geometry found for: {', '.join(skipped)}", file=sys.stderr)

    paths = context_paths + quiz_paths
    margin = 5
    width = bounds["max_x"] + margin
    height = bounds["max_y"] + margin

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {height:.2f}"\n'
        f'     data-lng-min="{projection["lngMin"]}" data-lat-max="{projection["latMax"]}" '
        f'data-scale="{projection["scale"]}">\n'
        + "\n".join(paths)
        + "\n</svg>\n"
    )

    SVG_FILE.parent.mkdir(parents=True, exist_ok=True)
    SVG_FILE.write_text(svg)
    print(f"Wrote {SVG_FILE} ({len(quiz_paths)} quiz + {len(context_paths)} context paths, "
          f"{SVG_FILE.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
