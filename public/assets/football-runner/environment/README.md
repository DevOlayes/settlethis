# Football Runner environment prototype

This is an isolated visual study. It does not replace or modify the production `SceneFactory`, runner collision world, obstacle pool, scoring, player controller or rewards.

Open `/football-environment-prototype` on a preview deployment to inspect the environment with the existing Sports Male 03 avatar and its native run animation.

## Prototype sources

- Assembled football club ground: `https://cdn.3dassets.dev/assets/19143/v1/model.glb`
- Soccer training corner: `https://cdn.3dassets.dev/assets/19144/v1/model.glb`
- Player: existing local `/assets/football-runner/player.glb`
- Running animation: existing local native Sports Male 03 animation through `loadRunnerAnimationManifest`

The two environment GLBs are the same assets supplied by the user from the Football Soccer Stadium and Club Grounds pack. The pack is published under CC0 1.0 Universal. The CDN is documented as CORS-enabled and the files are metre-scale, +Y up.

## What this prototype is for

- Check the assembled ground's scale and visual language beside the actual player.
- Evaluate the training-equipment layout as a separate training zone.
- Inspect the scene from multiple angles using pointer drag and pinch/scroll zoom.
- Judge lighting, pitch presentation, stand scale and player framing before changing the production runner.

This is an art-direction and compatibility preview, not a gameplay scene. No collision, lane, scoring or reward logic is connected. CDN availability and ordinary Android performance still need hands-on validation.
