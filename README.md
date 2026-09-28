# Pathfinder — Colorado bike path explorer demo

A screenshot-ready product exploration: search four South Suburban bike paths, select one from the list or map, view published trail statistics and concept imagery, and optionally sort nearby paths using browser location.

## Run

Serve this directory with any static HTTP server. For example: `python3 -m http.server 8000`. Open `http://localhost:8000`.

The page can be hosted directly from a GitHub Pages branch with `index.html` at the repository root. No build or API keys are required.

## Data provenance and limits

- Trail length and endpoint elevation difference come from [South Suburban Parks & Recreation](https://www.ssprd.org/Parks-Trails/Trails/Trail-Map). Its published lengths describe the trails in its district, not necessarily an entire regional route. Endpoint difference is not total ascent.
- The selected path requests mapped line segments from [Colorado Parks & Wildlife's COTREX feature service](https://services5.arcgis.com/ttNGmDvKQA7oeDQ3/arcgis/rest/services/COTREX_Trails_Populated_2026/FeatureServer/54) in the visitor's browser. The app shows a linked fallback when geometry cannot load. That data service says responsibility for accuracy rests with its sources; the layer description lists the trail-data update as November 25, 2024.
- OpenStreetMap provides the base tiles and attribution. Images are AI-generated atmosphere studies, visibly labeled in the interface; they do not depict the named trails.
- Marker coordinates are representative map points, not verified trail entrances. “Near me” sorts by proximity to those representative points and does not provide routing or safety guidance.
- No live closure, weather, surface, navigation, or accessibility claims are made. Official source links should be checked before a ride.

## Learn article angle

The interface connects browse state, a map selection, and a detailed path profile. The case study can examine the difference between a trail *line* and a usable trail *entrance*, the provenance of displayed statistics, permission-based geolocation, handling missing geometry, and why a candid prototype is stronger than invented live data.
