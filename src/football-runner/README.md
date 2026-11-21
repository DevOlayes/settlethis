# Football Runner engine architecture

The web prototype is being organised as a reusable game engine. React owns the surrounding page and HUD; the engine owns the 3D world, frame loop, player state, input, spawned objects and run lifecycle.

## Module map

| Module | Responsibility |
| --- | --- |
| `FootballRunner.tsx` | React page, HUD, start/pause/result overlays and engine lifecycle |
| `RunnerEngine.ts` | Coordinates the game loop, run state, player movement, object spawning, collision checks and score events |
| `SceneFactory.ts` | Creates the Three.js scene, camera, renderer, stadium foundation, resizing and scene disposal |
| `EntityFactory.ts` | Creates football collectibles and obstacle models |
| `PlayerCharacter.ts` | Builds the articulated full-kit footballer, including torso, numbered shirt, shorts, arms, jointed legs, socks and boots |
| `PlayerAnimator.ts` | Drives procedural running, lane lean, jump, slide, landing recovery and automatic collection-kick poses |
| `InputController.ts` | Converts keyboard and pointer swipes into game actions; owns and removes its event listeners |
| `ObjectPool.ts` | Reuses spawned Three.js groups instead of allocating and discarding them every time |
| `AssetLoader.ts` | Loads and caches GLB/GLTF assets, clones rigged scenes safely and reports asset progress |
| `PerformanceMonitor.ts` | Samples frame rate, average/worst frame time and slow-frame counts for engine telemetry |
| `config.ts` | Central location for visual, movement, spawning, collision and demo-reward tuning values |
| `math.ts` | Shared clamping, movement damping, speed progression and prototype reward calculation |
| `types.ts` | Shared engine phases, HUD data, callbacks, summaries and scene contracts |

## Runtime flow

1. The React page creates a `RunnerEngine` when the game surface mounts.
2. The engine creates the scene, attaches input, observes the game surface size and starts its render loop.
3. React calls the engine's `start`, `pause` and `resume` controls.
4. The engine updates simulation state and sends throttled HUD updates and phase/result events back to React.
5. The engine periodically publishes optional frame-performance snapshots without coupling telemetry to the React UI.
6. On unmount, the engine cancels its animation frame, removes listeners, disconnects resize observation, releases pooled objects and disposes GPU resources.

## Ownership boundaries

- React does not manipulate Three.js meshes or simulation variables.
- The engine does not render React UI or know about Telegram account identity.
- Scene/entity factories create visual objects but do not own the game loop.
- Input handling reports actions; the engine decides whether those actions are currently valid.
- Gameplay tuning is centralised in configuration rather than scattered through UI components.
- The 3D game is lazy-loaded as its own route bundle; visitors to the SETHIS landing page and main Telegram app do not need to download Three.js before opening Football Runner.
- GLB/GLTF assets can be loaded through a shared cache, with safe scene cloning for future skinned player models.
- Frame telemetry is available through an optional engine callback; it is instrumentation, not a claim that real-device performance has been validated.

## Current prototype limitations

The footballer is currently a self-contained, stylised procedural 3D character with articulated joints and procedural animation; it does not yet use a separately authored or motion-captured GLB character asset. The stadium, training grounds and player facilities are procedurally assembled from reusable Three.js geometry; authored high-detail environment assets and final art direction are still outstanding. Collision profiles, fair obstacle sequencing, world streaming, production reward verification, rewarded-ad rescues and persistence are not complete. Prototype SETHIS figures are display-only and must never be treated as wallet credits. Those systems belong to later roadmap stages.

## Stage 3 — player character and animation

The prototype character has been replaced by a reusable articulated footballer rig. The model is built from Three.js geometry and materials so the first web build has no external model download or asset licence dependency.

- Full football kit silhouette: coral jersey with contrasting trim and rear shirt number, dark shorts, socks, sock bands and football boots with studs.
- Separate head, torso, pelvis, shoulders, elbows, hips, knees, ankles and feet allow animation without moving the whole character as one rigid mesh.
- Procedural animation controller supports alternating running strides, arm counter-swing, lane-change banking, jump/tuck pose, crouched slide, landing compression and a right-foot kick when a collectible is picked up.
- Animation timing is driven by the engine delta time and can be reused by a future Telegram Mini App renderer.
- A GLB/GLTF asset loader remains available for a later replacement or upgraded skinned character; this stage does not claim a motion-captured or photorealistic asset.


## Stage 4 — controls and movement

- Three-lane steering supports left/right swipes, arrow keys and A/D.
- Jump supports upward swipe, up arrow, W and Space. Slide supports downward swipe, down arrow and S.
- Added large, accessible on-screen left/right/jump/slide buttons for touch users; controls are disabled outside an active run.
- Swipe recognition uses a centralised threshold, rejects ambiguous diagonal gestures and ignores very long drags. Pointer cancellation and lost capture clear the gesture without accidentally firing a move.
- Keyboard repeat is filtered so holding a key does not unexpectedly skip across lanes; inputs are ignored while typing or interacting with interface buttons.
- Lane changes use frame-rate-independent exponential easing and snap cleanly to lane centres.
- Jump and slide are mutually exclusive, with the full jump airtime retained for the jump pose and hurdle clearance.
- The browser tab automatically pauses an active run when it becomes hidden; resuming restarts the animation loop with a fresh frame timestamp.


## Stage 5 — collision and obstacle system

- Obstacles now carry explicit hitbox metadata (lane width, depth, physical height and permitted action clearance) alongside their visual geometry.
- The engine resolves player/object overlap using the obstacle-specific footprint rather than one oversized global rectangle.
- Cones and agility hurdles can be cleared by a sufficiently high jump; a raised training bar can be passed only during a slide; full-height mannequins and equipment carts require a lane change.
- Collision dimensions, player footprint and clearance margins are centralised in configuration for later tuning.
- Five obstacle families are available to the spawn pool. Visual models are built from reusable Three.js primitives and remain pooled between runs.
- This is an implementation milestone, not a gameplay fairness certification: the reaction window, actual jump/slide clearance feel and obstacle combinations remain for the final authorised gameplay validation.


## Stage 6 — connected football world

- Replaced the single placeholder stadium shell with a connected football environment: a marked main stadium pitch and stands, goal and net, roof structure, floodlight banks and scoreboard.
- Added a covered transition tunnel leading into adjacent training pitches, practice goals, benches, a glass-fronted training pavilion and recovery wing.
- Added a second covered walkway into the players' facility zone, with connected buildings and glazed frontage. The route remains open through the centre; these are environmental landmarks, not gameplay barriers.
- Built the environment as one continuous 180m world loop. The scene now advances over the full configured world length rather than recycling every 15m, keeping the stadium/training/facility sequence intact before it repeats.
- Kept all scenery within the existing Three.js scene factory and shared engine world so the same game engine can later be reused in the Telegram Mini App.
- Tuned renderer pixel ratio, shadow map size and shadow update behaviour for a more mobile-conscious baseline. Real-device performance still needs authorised validation.
- Environment is currently procedural geometry and materials. This stage does not claim authored photogrammetry, finished production art, final lighting approval or verified seamless visual performance.


## Stage 7 — football collectibles and kick feedback

- Rebuilt the collectible as a recognisable association-football model with a light spherical body and dark five-sided panel details arranged around the surface.
- Added a restrained SETHIS coral aura, a ground-level halo and local light so footballs remain readable against the pitch without changing the official logo colour.
- Preserved automatic pickup: entering the collection range increments the football count and points, then triggers the footballer's right-foot strike animation. No per-ball tap is required.
- Added a short pooled coral-and-warm-white collection burst with expanding rings and outward particles. Effects are reused and disposed with the engine rather than creating a fresh GPU object for every pickup.
- Collection feedback is independent of the reward calculation. Prototype SETHIS remains display-only; this stage does not introduce real CT deductions or token payouts.
- The football model, collection timing, kick pose and visual effects still require authorised gameplay and visual validation on browser and ordinary Android hardware.


## Stage 8 — chase camera, lighting and visual polish

- Added a third-person chase camera behind the footballer with delta-time damping. It responds subtly to lane changes and jumps while preserving a stable forward look-ahead.
- Reset camera position and look target at the start of each run for consistent restart framing.
- Tuned perspective, clipping distance and fog for greater depth across the connected stadium, training and facilities world.
- Refined the light rig with a warm key light, broad non-shadow-casting fill and restrained violet rim light. Shadow bias and camera bounds were tightened while retaining one 1024px shadow map.
- Capped device pixel ratio at 1.35; added fill lights do not cast shadows as a mobile-conscious rendering baseline.
- Code/build/deployment milestone only. Camera feel, lighting, shadow stability, frame pacing and ordinary Android appearance remain unverified until authorised final validation.


## Stage 9 — sound and game feedback

- Added a dedicated AudioFeedback module using the browser Web Audio API; the first implementation uses procedural synthesis and generated noise, so no third-party audio files or external asset downloads are required.
- Added a restrained, non-verbal stadium ambience bed, alternating running footfalls, jump and slide whooshes, a layered football collection/kick cue, collision impact and short distance/speed milestone chimes.
- Sound is created and resumed only from the player's Start/Resume gesture to respect browser autoplay restrictions. If audio is unavailable or blocked, the game continues silently.
- Added an always-visible sound on/off control. Muting fades the ambience and suppresses effects; pausing reduces the ambience, while a running session restores it.
- Audio nodes and the ambience source are cleaned up when the game engine is disposed.
- No external audio assets, music tracks or voice recordings are included. Sound levels and mix are an initial implementation and still require listening checks on desktop speakers, headphones and ordinary Android devices during authorised final validation.
