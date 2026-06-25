# My Japan Pics

An interactive map of my Japan trip in November 2025 — 389 geotagged photos displayed as pins on a map, browsable by location.

## Features

- Interactive map with individual pins for each photo, positioned from EXIF GPS metadata
- Click or hover a pin to open a photo popup
- Date and time of capture displayed on each photo
- Personal description per photo, editable inline
- Fullscreen photo view
- Filter panel to show/hide photos by location

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router, API Routes
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [MapLibre GL JS](https://maplibre.org/) via [react-map-gl](https://visgl.github.io/react-map-gl/) — free, no API key required
- [OpenFreeMap](https://openfreemap.org/) — map tiles
- [exifr](https://github.com/MikeKovarik/exifr) — EXIF GPS & date extraction
- [sharp](https://sharp.pixelplumbing.com/) — thumbnail generation

## Data

Photos are not included in this repository. The `assets/` folder (original photos) and `public/thumbs/` (generated thumbnails) are gitignored. Descriptions are stored locally in `data/descriptions.json`.
