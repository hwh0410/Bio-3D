# Bio-3D | 沼氣領航員拜爾

Bio is the **Biogas Inspector Buddy**, an original green robot mascot for biogas plant inspection and safety education.

## Version v0.1
- Procedural 3D character with yellow hardhat, leaf emblem, luminous eyes, dark face screen, green safety suit, boots, gloves and chest gauge.
- Uses **Python, numpy and trimesh** for editable geometry.
- Default front direction: **-Y**; up: **+Z**.
- The character is a first-pass stylized prototype, **not yet rigged or animation-ready**.

## Build
```bash
python -m pip install -r requirements.txt
python scripts/build_bio.py
```
Generated files: `models/Bio_v0.1.glb` and `models/Bio_v0.1.obj`.

The `Build Bio 3D` GitHub Actions workflow also builds the model and publishes it as a downloadable workflow artifact. If repository workflow permissions allow it, the workflow commits the generated GLB into `models/`.

## Design reference
Based on two original user-supplied character sheets: standard views / expressions, and standard poses. v0.1 aims to preserve recognizable character identity; future planned improvements include refined helmet geometry, smoother hard-surface topology, face expressions, rigging and eight inspection poses.

## License and ownership
Character artwork and related brand identity belong to their respective creator(s). No open-content license is implied for the mascot. Code may be used internally in this project.


## GitHub Pages 互動預覽 / Transparent PNG Studio

The repository root now contains a **static 3D studio**, with no backend or database required:
- Orbit, zoom, and front / three-quarter / side / back presets.
- Six facial expressions.
- Checkerboard, white, dark, or soft-green **preview** backgrounds.
- Export the current view as a **real transparent PNG (alpha)** at 1024, 2048 or 3072 pixels.
- Mobile and desktop layouts.

**Enable Pages (one-time):** GitHub repository → **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**.

Expected published URL: **https://hwh0410.github.io/Bio-3D/** (available only after GitHub Pages is enabled and deployed).

This viewer uses a procedural Three.js reconstruction matching the v0.1 Python model, so the viewer does **not** depend on the GLB build workflow or any binary file being committed. Three.js is fetched from a CDN, so viewing requires an internet connection. PNG export occurs entirely in the browser, including on supported mobile browsers.
