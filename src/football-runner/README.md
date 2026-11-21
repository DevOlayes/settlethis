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
| `PlayerAnimator.ts` | Crossfades rigged run, sprint, jump, slide, crouch and kick states; retains the procedural fallback controller |
| `RiggedPlayerAsset.ts` | Loads the bundled Sports Male 03 GLB, canonicalizes its Biped skeleton, loads approved local animation packs and retargets clips |
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

The actual Sports Male 03 human avatar and two verified animation packs are now bundled under `public/assets/football-runner/`. The loader maps the model's Biped bones into the retargeter's canonical humanoid naming, decodes its Meshopt geometry, retargets the selected Quaternius clips and keeps the procedural footballer as a fallback unless the complete required movement set is available.

The animation system and assets are committed, but the character has not yet been visually validated in a running browser session. The current code/build work does not establish that every retargeted pose looks natural, that feet remain planted, or that the avatar fits the camera and collision capsule perfectly. Those checks remain for the authorised final validation window. The environment remains procedural geometry and materials; authored high-detail environment assets and final art direction are still outstanding. Collision fairness, production reward verification, rewarded-ad rescues and persistence are not complete. Prototype SETHIS figures remain display-only and must never be treated as wallet credits.

## Stage 3 — player character and animation

- Recovered the user's original `Sports_Male_03.glb` from Library and verified the downloaded production copy is byte-for-byte identical: SHA-256 `ad4b96ce02b6856c73cf3045631d49981b4f896898b1c1097b3339410ad3e590`.
- The avatar has an 80-joint Biped rig, 9,534 triangles, five embedded textures and three materials. Its MIT licence text is bundled beside the model.
- Bundled Quaternius Universal Animation Library 1 Standard (CC0) and Universal Animation Library 2 Standard (CC0), with checksum verification and licence records.
- Selected in-place clips include jog/run, sprint, jump start, airborne loop, landing, crouch-forward, slide start, slide loop and slide exit.
- Added Biped-to-canonical bone mapping, Meshopt decoding, source-clip filtering, coverage-gated retargeting and crossfades. The procedural footballer remains a safe fallback until the complete required motion set is loaded.
- Added an original in-place football collection kick animation on the rigged avatar; it is not misrepresented as third-party soccer motion capture.
- This is an asset-integration and build milestone. Visual quality, animation timing, foot contact, facing direction and ordinary Android performance still require authorised validation.

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


## Stage 10 — endless generation and progressive difficulty

- Replaced timer-only single-object spawning with distance-based pattern generation. Spawn spacing scales with current running speed so the intended reaction window does not collapse as the footballer accelerates.
- Runs begin with a short, readable warm-up sequence. New rows continue to stream in ahead of the player, with the next spacing adjusted smoothly from the current speed and difficulty.
- Difficulty increases continuously over the first 1,800 metres: reaction windows narrow gradually, football-only rows become less frequent, and two-lane obstacle patterns become more common. There are no discrete stages or sudden difficulty jumps.
- Every obstacle pattern blocks at most two of the three lanes, leaving at least one unobstructed route. Obstacle variants rotate without immediate repetition, and collectible lines are kept in a single lane or placed on a safe route.
- Football lines use pooled entities and fixed spacing; obstacle and collectible creation continues to use the existing object pools.
- The progression values are initial tuning defaults, not a claim that patterns have been proven fair. Actual solvability, pacing and difficulty still require authorised gameplay validation.


## Stage 11 — points, distance and personal records

- Centralised scoring values in configuration: 12 points per metre travelled and 100 points per football collected.
- Total score is calculated from the full travelled distance and football count, avoiding frame-by-frame rounding loss.
- Results include distance points, football collection points, total points and collected football count. The existing simulated SETHIS display remains explicitly prototype-only and is not a wallet credit.
- Added browser-local personal bests for distance and points, total completed runs and a rolling history of the 20 most recent runs. The start screen shows the best and three latest results; the result screen highlights new records and the all-time best.
- Records are stored locally on the current browser/device under a versioned key. They are not cross-device, account-linked or authoritative leaderboard data. The record shape is intentionally simple to support a later authenticated server-side ranking system.
- No CT charging, real SETHIS payout, account sync or public leaderboard writes are introduced in this stage.
- Score balance, record persistence across supported browsers and mobile layout still require authorised final validation.

## Stage 12 — provisional SETHIS economy and reward calculation

- Replaced the opaque single-number reward estimate with a transparent breakdown: collected-football value, distance milestone bonus, and one performance-tier bonus. The calculation sanitises negative/non-finite inputs and uses integer football counts.
- Current tuning is explicitly provisional and display-only: 5 preview SETHIS per football; 10 per completed 500m; 10 bonus at 5,000 points or 20 at 10,000 points (highest qualifying tier only); 1,500 preview SETHIS maximum per run.
- Added a 1,500 SETHIS daily preview ceiling across runs on the current browser/device. The local preview counter uses the device's local calendar date and is deliberately not authoritative; clearing storage, switching devices or changing the clock can alter it. It must never be used to decide a wallet credit.
- Added the agreed design limits to central configuration: no more than two rewarded-ad rescues in one run and ten rewarded ads per day. This stage does not show a fake ad, grant a rescue, count an ad impression, or call Monetag; actual rescue UI and provider callbacks remain disabled until the game flow and verified ad callback are implemented.
- Kept three currencies/metrics distinct: points measure performance; CT is the game-entry currency; SETHIS is the platform reward token. This prototype does not deduct CT or credit SETHIS.
- **Security gate:** client-side distance, football counts, points, local daily totals and ad counters are untrusted. A secure production payout requires an authenticated Telegram session, a server-issued run ticket/nonce, server-verifiable gameplay evidence (or server-authoritative simulation), server-side reward calculation, D1 idempotency and daily-cap enforcement, plus a verified rewarded-ad provider callback before granting a rescue. A client-submitted score alone is not proof. No production reward endpoint or wallet-credit path is enabled in this stage because the current browser simulation cannot independently prove that a claimed run occurred.
- The ~150 SETHIS figure is a balancing reference for a good first run, not a promise or guaranteed payout. All formula values remain provisional pending the final economy decision.
- No live gameplay, rewarded-ad, Telegram-authentication or wallet-credit validation was performed. These checks remain reserved for the authorised final validation stage.

## Stage 13 — complete game screens and gameplay UX

- Completed the start flow with a concise game introduction, personal best/recent-run context, a collapsible How to Play guide, and a clear Start Run action.
- Added a readable control guide for three-lane movement, jump, slide and automatic football collection. Existing swipe, keyboard and on-screen touch controls remain available.
- Improved the pause flow with Resume, Restart and Exit to Games actions. Restart and exit now require confirmation so an accidental tap does not silently discard an active run.
- Added an explicit collision/full-time results presentation with distance, score, football count, points breakdown, provisional reward breakdown, daily preview cap and personal-record feedback.
- Added an honest rescue state: rewarded-ad rescue is unavailable in this standalone web prototype. The screen explains that provider verification is not connected rather than pretending an ad was watched or granting a rescue. The configured limits (two rescues per run / ten rewarded ads per day) remain design constraints only.
- Added a confirmation dialog for restarting or leaving, an Escape-key pause/exit affordance, accessible labels and modal semantics, scrollable long-form results, and responsive overlay styling for shorter mobile screens.
- Existing automatic pause when the browser tab is hidden is retained. Sound toggle and touch controls remain available and respect the active game phase.
- This is an implementation/build milestone only. No live gameplay, browser interaction, audio, ad-provider, or Android device testing was performed. Collision feel, screen transitions, keyboard focus behaviour and small-screen layout remain for the authorised final validation stage.

## Stage 14 — asynchronous challenges, sharing and rankings

- Added a compact, versioned challenge payload encoded into a shareable `/football-runner?challenge=...` URL. It carries the challenge ID, creation time and the score to beat (points, distance and collected footballs); the URL opens the standalone web game directly.
- A recipient sees the challenge before starting. After completing a run, the game compares scores and provides a one-tap share action that sends a challenge-result URL back to the original player.
- The original player can open the response URL to see whether their score held, was beaten or tied. No simultaneous online session, account matching or live presence is required.
- Winner rules are explicit and deterministic: total points first; distance breaks a points tie; collected footballs break a remaining tie.
- Sharing uses the device share sheet where available, then clipboard copy, with a manual-copy fallback. The share action does not require a Telegram bot or a new social integration.
- Added a personal top-five leaderboard from the 20 most recent locally stored runs, sorted by points, distance and footballs. It is clearly labelled as browser/device-local and is not presented as a public ranking.
- Challenge payload parsing is defensive: version and field checks, numeric bounds, identifier validation and a maximum encoded URL length. Invalid or malformed challenge parameters are ignored rather than crashing the game.
- **Important prototype boundary:** challenge links contain self-reported client scores. They can be copied, edited or fabricated and are not signed by a trusted server. The UI explicitly marks received results as unverified. They are suitable for friendly web-preview challenges only—not prizes, SETHIS payouts, CT stakes, official rankings or anti-cheat decisions.
- Global cross-player rankings and trusted challenge records are intentionally deferred until authenticated Telegram identity, server-side run verification, persistent D1 records, challenge ownership/expiry rules and anti-cheat are available in the later Telegram/release integration stage. No unauthenticated score-submission endpoint or wallet/reward path was introduced.
- No live browser, share-sheet, gameplay or Android device test was run. Challenge-link handoff, mobile sharing behaviour, result comparison and local leaderboard layout remain for the authorised final validation stage.

## Stage 15 — performance optimisation and final-validation preparation

### Runtime optimisations implemented

- Added device-aware render profiles in `RenderQuality.ts`. Initial quality uses available device memory, CPU core count and coarse-pointer detection: low-capability devices start at Low, touch-first and mid-range devices start at Balanced, and stronger desktop-class devices start at High.
- Added adaptive quality control using five-second frame-performance samples. Two consecutive struggling samples step rendering down; three consecutive healthy samples allow it to step back up. Hysteresis avoids changing quality on every brief frame-time fluctuation.
- Render profiles cap device pixel ratio (Low 0.85, Balanced 1.05, High 1.30) and use no shadow map on Low, a 512px shadow map on Balanced and a 1024px map on High. Antialiasing is disabled only for devices initially classified Low.
- Changed the WebGL power preference from an unconditional high-performance request to the browser's default choice, allowing the platform to balance performance and power.
- Reduced static scenery shadow work: environmental box geometry no longer casts dynamic shadows by default, while the footballer and active gameplay entities retain their own shadow behaviour. The main directional key light is the only light managed by adaptive shadow quality.
- Performance snapshots now include sampled frame count and slow-frame ratio in addition to average/worst frame time, FPS and slow-frame count. The engine uses these metrics internally; no unsupported performance claim or public telemetry upload is made.
- Hardened responsive resizing by ignoring unchanged dimensions and preventing zero-sized camera/renderer dimensions.
- Hardened teardown for future textured assets: scene and entity disposal now deduplicates and releases geometries, materials and texture maps, avoiding repeated disposal of shared resources.
- Adaptive quality counters reset at the beginning of each run. Existing object pooling, lazy-loaded game bundle, tab-hidden pause and Web Audio cleanup remain in place.

### Final validation plan — deliberately not run yet

The following checks are prepared for the final validation window after all development stages are complete and the user explicitly authorises testing:

1. **Android device coverage:** ordinary/low-memory Android, mid-range Android and a stronger Android device; test current Chrome and Telegram Mini App WebView separately.
2. **Frame pacing:** capture repeated 60-second samples at the start, middle and later difficulty; record average FPS, average/worst frame time, slow-frame ratio and quality-profile transitions. Check for sustained stalls, overheating and battery drain over a longer session.
3. **Gameplay correctness:** lane boundaries, diagonal swipes, jump/slide clearance, collision timing, safe obstacle patterns, collectible pickup, score totals, pause/resume, restart and exit.
4. **Memory/GPU lifecycle:** repeat start/end/restart cycles, navigate away and back, inspect renderer resource counts and memory growth, and verify cleanup after disposal.
5. **Browser lifecycle:** background/foreground, screen lock/unlock, orientation/viewport changes, WebGL context loss/recovery where supported, and low-memory tab recovery.
6. **Audio and sharing:** mute/unmute, pause/resume sound, supported/unsupported share-sheet and clipboard fallback, challenge link round-trip and result comparison.
7. **Compatibility and network:** current Android Chrome, desktop Chrome/Firefox/Safari where available, slow connection, offline/return-online behaviour and direct-link route refresh.
8. **Economy/security:** verify no client-only challenge score or preview reward can credit a wallet; verify authenticated server-side score/reward controls during the later integration stage.

### Validation boundary

- Stage 15 changes are implementation and build preparation, not proof of measured device performance.
- No automated test suite, live gameplay, browser interaction, Android device test, GPU profiling, WebGL context-loss test, or audio/share-sheet test was run during this stage.
- TypeScript compilation and production bundling are permitted and will be checked through the GitHub build workflow. Automated test suites remain deferred until the user authorises final validation.
- No real CT charge, SETHIS payout, rewarded-ad callback, Telegram identity integration or public leaderboard endpoint is introduced here.


## Rigged-player asset and movement integration

### Bundled avatar

- `public/assets/football-runner/player.glb` is the exact Sports Male 03 file recovered from the user's Library. The CI importer checked the file's SHA-256 against the Library copy and confirmed an exact byte match.
- The model's embedded Microsoft MIT licence is preserved in `public/assets/football-runner/LICENSE-MICROSOFT.txt`.
- The loader enables Three.js Meshopt decoding and maps the 3ds Max Biped names (`Bip01 Pelvis`, spine, limbs and finger chains) to Mixamo-style names before the retarget library canonicalizes the skeleton.
- The model is only promoted into the live scene after all nine required locomotion clips have retargeted successfully. If the model, texture decoding or any required clip fails, the existing procedural footballer remains visible.

### Bundled animation packs

- `UAL1_Standard.pack`: gzip-compressed Quaternius Universal Animation Library 1 Standard GLB, CC0 1.0. Selected clips: `Jog_Fwd_Loop`, `Sprint_Loop`, `Jump_Start`, `Jump_Loop`, `Jump_Land`, `Crouch_Fwd_Loop` and `Crouch_Idle_Loop`.
- `UAL2_Standard.pack`: gzip-compressed Quaternius Universal Animation Library 2 Standard GLB, CC0 1.0. Selected clips: `Slide_Start`, `Slide_Loop`, `Slide_Exit` and the optional Ninja Jump chain.
- The `_Standard` variants are in-place clips. The game simulation, not the animation, owns forward movement and lane position.
- Original Quaternius licence text and checksums/source records are preserved in `public/assets/football-runner/animations/` and `manifest.json`.
- The import workflow obtains the public Standard releases, verifies their hashes, checks the exact clip names and commits the resulting local assets. Gameplay does not call Quaternius, KinemIQ or any external animation API.

### Runtime movement states

- **Run and sprint:** Jog/run cycle is the default locomotion; sprint is selected as the speed ratio rises. The cycle playback rate follows the game speed.
- **Jump:** Separate take-off, airborne and landing clips are selected according to the jump lifecycle.
- **Slide:** Slide-start plays on entry, slide-loop holds while the slide is active, and slide-exit plays during recovery. Crouch-forward remains an available low-profile fallback.
- **Lane changes:** The gameplay root stays aligned with its collision lane while smooth banking and counter-rotation give lateral movement some body weight.
- **Football collection:** An original in-place right-foot kick is authored on the rigged model and triggered automatically when the player collects a glowing football.
- **Transitions:** The animation controller crossfades between states, returns to the run cycle after one-shot actions and preserves the safe procedural character if the required clip set is incomplete.

### Technical and validation boundary

- `@three-ws/retarget` (Apache-2.0) handles canonical humanoid mapping, rest-pose/hip-axis correction and clip coverage checks. Clips below the 50% coverage gate are rejected rather than forced onto the model.
- Animation assets are local and same-origin; no remote animation service is called during play. Gzip-packed `.pack` files are decompressed with the browser's native `DecompressionStream` API.
- The football kick is original game-authored animation. The current bundle does not claim to contain a captured professional soccer-kick performance.
- GitHub build and Cloudflare deployment checks are separate from visual validation. No browser preview, live gameplay, Android device test or final animation quality sign-off has been performed during development.

## Stage 16 — Telegram Mini App early-access integration

- Football Runner is available from the authenticated Games hub and is gated by the same verified Telegram Mini App session as the rest of SETHIS. Direct browser visitors are sent to the Telegram introduction rather than receiving guest game access.
- A server-created run session is required before gameplay. Completed results are stored against the authenticated Telegram member in Cloudflare D1, and the member's personal bests and recent runs are available across devices.
- The server rejects duplicate, expired and implausible submissions using elapsed server time, maximum movement speed, football-count bounds and score arithmetic. These checks are integrity screening, not a cryptographic replay proof; account records are not yet eligible for prizes or public leaderboard ranking.
- The current Runner launch is explicitly free early access. No CT is deducted, no SETHIS is credited, and rewarded-ad rescues are disabled. The discussed 500 CT daily access, reward formula and ad limits remain inactive until their exact economy rules are approved.
- The Mini App reuses the same Three.js engine and locally bundled avatar/animation assets. No external game or animation runtime is required.
