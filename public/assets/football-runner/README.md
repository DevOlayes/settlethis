# Football Runner character asset

The procedural character is a temporary fallback only. The target production character is a licensed, rigged humanoid footballer delivered as a local GLB file.

## Required asset

Place the selected and licence-cleared model at:

`public/assets/football-runner/player.glb`

Requirements:
- recognisable human footballer silhouette, with natural athletic proportions
- football shirt, shorts, socks and boots; no generic stick/mannequin appearance
- skinned mesh and a usable humanoid skeleton
- neutral or relaxed bind pose, feet aligned to the ground
- GLB/glTF 2.0, PBR materials and embedded textures
- preferably 10–20k triangles for the player mesh and modest texture sizes for mobile
- animation clips or a skeleton compatible with retargeted clips for running, jump, slide and kick

## Sourcing and licensing

Candidate free animation-ready prototype: CodeLove, **Male Athlete 03**. Its listing states 9,534 triangles, 80 bones, a 785 KB GLB, ten compatible animation clips and MIT licensing. It is a generic sports athlete, not a finished football kit, so it must pass a visual review and kit adaptation before it can become the final player.

Candidate dedicated football assets: Fab listings for rigged realistic soccer players. These are closer to the required kit and role, but price and exact licence must be checked on the listing before any purchase.

Adobe Mixamo is the preferred free animation authoring/auto-rigging option where compatible. Keep downloaded model and animation files with their original licence notices. Do not assume that every marketplace asset permits commercial use or redistribution.

## Runtime integration

`RiggedPlayerAsset.ts` loads the local GLB through Three.js GLTFLoader, normalises its height without changing proportions, enables mesh shadows and exposes embedded animation clips. The game keeps its procedural player as a fallback until the licensed asset is supplied. Do not hotlink marketplace or library model files at runtime.

Three.js GLTFLoader and AnimationMixer provide the GLB/skinned-mesh/animation pipeline. Animation clips should be cross-faded instead of snapping between poses.

## Approval gate

Do not buy an asset or replace the current character with an unreviewed model. Inspect the actual model, skeleton, texture quality, animation compatibility, file size and licence first. Final acceptance requires a mobile gameplay review from the chase-camera angle.
