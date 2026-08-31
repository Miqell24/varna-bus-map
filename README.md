# Varna Public Transport — interactive map

Interactive, poster-grade map of the public transport network of **Varna**:
29 bus lines and the three surviving trolleybus lines — 394 stops, 1 761 km,
weighted mean matching error 1.90 m.

## Live

Local build on port 8167 (`npm run serve`).

Everything comes from ONE feed on the **Bulgarian National Access Point**
(sipbg.gov.bg), rebuilt nightly, resolved through the portal API exactly as in
Sofia and Plovdiv. `route_type` 11 marks the trolleybuses, which the engine
paints in the family's green.

| mode | route_type | graph |
|---|---|---|
| buses | 3 | OSM roadways |
| trolleybuses | 11 | the same roadways, in green |

**Stop names are this feed's real work.** 606 of its 616 names shout, and each
carries two extra things behind slashes:

```
ЯНКО МИХАЙЛОВ / КЪМ ЦАР ОСВОБОДИТЕЛ / YANKO MIHAYLOV
name             direction              transliteration
```

The transliteration is a second copy of the name and goes; so does the
direction member (488 of them, opening with ЗА / КЪМ / ОТ), which belongs to
the pole rather than to the place — the map aggregates poles by name and
prints that name on the street, exactly as in Niš. What is left is rewritten
by `pipeline/lib/caps.mjs`, the Athens recipe retold in Bulgarian: a
dictionary of properly-cased word forms harvested from the OSM extract this
build already reads. Bulgarian capitalises only the first word of a compound
name, so the dictionary — not title case — has to decide.

One trap worth recording: JavaScript's `\b` is defined on ASCII letters only,
so `/^ЗА\b/` never matches "ЗА ЦЕНТЪР" and the first run left every direction
member in place.

## Pipeline

`npm run download` fetches the feed and cuts the OSM extract. **The OSM
data comes from Geofabrik, not Overpass** — the public mirrors were answering
504 to every request on the day this map was built, even for a single small
city box — so `pipeline/pbf-tiles.py` (needs `pip3 install --user osmium`)
clips the tiles out of `bulgaria-latest.osm.pbf`, writing exactly the JSON shape Overpass would
have returned, node ids included.

`npm run build` map-matches every line (HMM/Viterbi on the OSM graph) and
writes GeoJSON to `data/out/`; `npm run lines` adds the line-by-line view.
`npm run serve` hosts the map at <http://localhost:8167>.

Data: Bulgarian National Access Point (sipbg.gov.bg) ·
base map © OpenFreeMap / OpenMapTiles / OpenStreetMap contributors.
