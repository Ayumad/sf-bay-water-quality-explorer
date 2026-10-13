> Historical 1.0 reference. Habitat-layer exploration is deferred from the focused M1–M4 v2 MVP. See `v2-architecture.md`.

# Habitat layer provenance

The habitat view uses cached map tiles from the **Baylands Habitat Map 2020 (BHM 2020), version 1.1**, published by the San Francisco Estuary Institute and Aquatic Science Center. The source represents conditions in 2020 and was published in 2024. It replaces the prototype's hand-drawn habitat polygons with the source map's shoreline-following geometry across Suisun Bay, Carquinez Strait, San Pablo Bay, Central Bay, South Bay, and Lower South Bay.

- Source project: https://www.sfei.org/projects/baylands-habitat-map-2020
- Source metadata: https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds3190_fpu/FeatureServer/0
- Web Mercator tile service: https://tiles.arcgis.com/tiles/8V9ShUQ1DGYVLtOg/arcgis/rest/services/BaylandsHabitatMap2020_v1_1/MapServer
- Copyright: San Francisco Estuary Institute and Aquatic Science Center

The displayed categories follow the source's Level 4 habitat classes: deep and shallow subtidal water, tidal flat, tidal pond or panne, intertidal channel, tidal marsh, other marsh, other open water, and non-aquatic diked bayland.

This is a regional learning layer, not a parcel, jurisdiction, wetland delineation, or current field survey. Source age, remote-sensing methods, classification uncertainty, and minimum mapping units still limit precision. The app keeps those limits visible and links to the source rather than redrawing or inventing boundaries.
