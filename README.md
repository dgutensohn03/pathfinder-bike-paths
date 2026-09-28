# Pathfinder — Front Range bike paths

A static, screenshot-ready product exploration for finding a bicycle path that fits a ride. [Open the live demo](https://dgutensohn03.github.io/pathfinder-bike-paths/).

## The rider's question

“Where could I ride today?” Pathfinder lets someone search 30 named off-street paths, narrow by mapped length and surface, sort relative to a selected place or their approximate device location, inspect mapped segments, and open the area map. The path profile explains why it may fit and shows what the data can and cannot tell them. Visitors outside the Front Range still see the full catalog and can choose “Explore near Denver” instead of receiving irrelevant far-away proximity results.

## Data and image choices

- The checked-in [snapshot](data/trails.json) is generated from the [Denver Regional Council of Governments bicycle facilities layer](https://services.arcgis.com/rD2ylXRs80UroD90/ArcGIS/rest/services/DRCOG_Corridors_Data_Compilation_for_Analysis_WFL1/FeatureServer/102). The [import script](scripts/import_trails.py) selects 30 named paths, existing off-street shared-use and unpaved segments, in a fixed Front Range study area. It paginates the service and simplifies coordinates for this preview. To refresh: `python scripts/import_trails.py`; review the generated diff before committing.
- “Mapped mi” is the sum of selected segment lengths within the study area. Branches, parallel facilities, overlap, and gaps may be present. It is **not** a continuous ride distance, route recommendation, elevation profile, or current condition. The center pin is an approximate map center, not a trailhead. Place and device sorting use great-circle distance to these centers.
- Selected path profiles place mapped stats ahead of an on-location photo gallery. Verified images currently cover Cherry Creek, Clear Creek in Golden, High Line Canal, the South Platte bridge in Valverde, Waterton Canyon, Bear Creek, a western C-470 corridor segment, and Boulder Creek Path. The Boulder image is clearly marked as a 1997 photograph. Each image links to its original Wikimedia Commons file and shows its photographer and license. The Cherry Creek photos are [Raysonho’s CC0 images](https://commons.wikimedia.org/wiki/File:CherryCreekTrail.jpg). CC BY-SA images link to their licenses and disclose display cropping. Paths without a verified image say so instead of showing a generic landscape. Responsive images are served by Wikimedia Commons at up to 960 px. Noncommercial intent does not waive copyright or license terms.
- Base map © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Leaflet is loaded from unpkg. The mapped lines are served from this repository, so no trail API call is needed when a visitor selects a path.

## Discovery design rationale

The interface borrows useful conventions from current local discovery products, including Yelp's Find/Near search, scannable filters, photo-forward results, and a detailed selected place alongside a map. Pathfinder applies those patterns to a different question: which mapped bike path might suit a ride? Results show mapped length and surface instead of invented ratings or reviews. A “With photos” filter limits the list to paths with location-specific, credited imagery. Selection keeps the result, map highlight, and path profile in sync. On phones, results have a bounded vertical scroll area, an explicit map shortcut, and a compact map followed immediately by the selected path facts and swipeable photos. The warm neutral palette and route-mark logo are Pathfinder's own visual identity; the prototype has no Yelp affiliation.

## Run locally

```sh
python -m http.server 8000
```

Open http://localhost:8000. Geolocation requires browser permission and a secure context when hosted. The site is plain HTML/CSS/JS and deploys from the repository root to GitHub Pages.

## Scope and next steps

This is a regional discovery prototype, not navigation. A production version would add reviewed trailhead access points, managing-agency condition feeds and closures, a stronger search index, moderation for user photos, and measured usability outcomes. Refreshes are deliberate so changes to the source schema or route identities can be reviewed.
