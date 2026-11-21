# Football Runner engine architecture

The web prototype is being organised as a reusable game engine. React owns the surrounding page and HUD; the engine owns the 3D world, frame loop, player state, input, spawned objects and run lifecycle.

## Module map

| Module | Responsibility |
| --- | --- |
| `FootballRunner.tsx` | React page, HUD, start/pause/result overlays and engine lifecycle |
| `RunnerEngine.ts` | Coordinates the game loop, run state, player movement, object spawning, collision checks and score events |
| `SceneFactory.ts` | Creates the Three.js scene, camera, renderer, stadium foundation, resizing and scene disposal |
| `EntityFactory.ts` | Creates the player rig, football collectibles and obstacle models |
| `InputController.ts` | Converts keyboard and pointer swipes into game actions; owns and removes its event listeners |
| `ObjectPool.ts` | Reuses spawned Three.js groups instead of allocating and discarding them every time |
| `config.ts` | Central location for visual, movement, spawning, collision and demo-reward tuning values |
| `math.ts` | Shared clamping, movement damping, speed progression and prototype reward calculation |
| `types.ts` | Shared engine phases, HUD data, callbacks, summaries and scene contracts |

## Runtime flow

1. The React page creates a `RunnerEngine` when the game surface mounts.
2. The engine creates the scene, attaches input, observes the game surface size and starts its render loop.
3. React calls the engine's `start`, `pause` and `resume` controls.
4. The engine updates simulation state and sends throttled HUD updates and phase/result events back to React.
5. On unmount, the engine cancels its animation frame, removes listeners, disconnects resize observation, releases pooled objects and disposes GPU resources.

## Ownership boundaries

- React does not manipulate Three.js meshes or simulation variables.
- The engine does not render React UI or know about Telegram account identity.
- Scene/entity factories create visual objects but do not own the game loop.
- Input handling reports actions; the engine decides whether those actions are currently valid.
- Gameplay tuning is centralised in configuration rather than scattered through UI components.

## Current prototype limitations

The player and environment are still temporary procedural geometry. Collision profiles, fair obstacle sequencing, advanced animation, world streaming, production reward verification, rewarded-ad rescues and persistence are not complete. Prototype SETHIS figures are display-only and must never be treated as wallet credits. Those systems belong to later roadmap stages.