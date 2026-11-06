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
