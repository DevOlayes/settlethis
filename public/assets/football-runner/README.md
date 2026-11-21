# Football Runner avatar and animation assets

## Avatar

Sports Male 03 / Male Athlete 03, Microsoft Rocketbox model. The model is 9,534 triangles with an 80-joint Biped rig, five embedded textures and three materials. It is distributed under the MIT licence; retain LICENSE-MICROSOFT.txt.

Source: https://models.codelove.in/models/sports-male-03/

The asset importer verifies the model's Microsoft copyright metadata, 80-joint skeleton signature, five images and three materials against the file recovered from the user's Library. It records whether the downloaded source is byte-identical to that Library file in animations/manifest.json.

## Animations

- Quaternius Universal Animation Library 1 Standard: CC0 1.0.
- Quaternius Universal Animation Library 2 Standard: CC0 1.0.
- The bundled _Standard GLBs are in-place variants, not root-motion (_RM) variants. The selected clips are gzip-packed into local .pack files to reduce mobile download size. Game code owns character world movement.
- Only the required movement clips are retargeted at runtime: jog/run, sprint, jump take-off/air/landing, crouch and slide start/loop/exit.
- The full source pack ZIP hashes and selected clip names are recorded in animations/manifest.json.

Sources:
- https://quaternius.itch.io/universal-animation-library
- https://quaternius.itch.io/universal-animation-library-2
- https://quaternius.com/packs/universalanimationlibrary.html
- https://quaternius.com/packs/universalanimationlibrary2.html

The football collection kick is an original game-authored clip, not a third-party motion-capture asset.

## In-place running animation

The primary runner gait is the locally bundled `xbot-run.json` canonical humanoid clip.
It is derived from the Mixamo **Run** animation distributed in the three.js Xbot GLB
and canonicalized by the three.ws animation pipeline. The source licensing record
documents Mixamo's permission for free commercial use when the animation is
incorporated into a product. The clip contains 156 skeletal tracks and has no
forward root travel; game-world scrolling remains responsible for forward motion.
At runtime it is retargeted to the Sports Male 03 avatar and accepted only when
the expected hips, leg, arm and forearm tracks are all present.
