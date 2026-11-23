import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";
import { RunnerAudioFeedback } from "./AudioFeedback";
import { clamp, getRunSpeed } from "./math";
import { InputController } from "./InputController";
import { ObjectPool } from "./ObjectPool";
import { animateCollectionEffect, createCollectible, createCollectionEffect, createObstacle } from "./EntityFactory";
import { createPlayerCharacter } from "./PlayerCharacter";
import { disposeRunnerCharacterModel, loadRunnerAnimationManifest, loadRunnerCharacter } from "./RiggedPlayerAsset";
import { PlayerAnimator } from "./PlayerAnimator";
import { createNativeBipedJumpClips, NATIVE_BIPED_JUMP_PHASES } from "./NativeBipedJump";
import { createNativeBipedManeuverClips } from "./NativeBipedManeuvers";
import { RunnerPerformanceMonitor } from "./PerformanceMonitor";
import { createRunnerScene, disposeRunnerScene, loadClubGroundEnvironment, resizeRunnerScene } from "./SceneFactory";
import { applyRunnerRenderQuality } from "./RenderQuality";
import type { RunnerAction, RunnerEngineCallbacks, RunnerPhase, RunnerSceneBundle, RunnerSummary, RunnerPerformanceSnapshot, RunnerRenderQuality } from "./types";

type ActiveObject = THREE.Group;

export class RunnerEngine {
  private readonly bundle: RunnerSceneBundle;
  private readonly host: HTMLElement;
  private readonly playerCharacter = createPlayerCharacter();
  private readonly playerAnimator = new PlayerAnimator(this.playerCharacter);
  private loadedPlayerModel?: THREE.Group;
  private characterReady = false;
  private environmentReady = true;
  private startWhenCharacterReady = false;
  private pendingRiggedPlayer?: { model: THREE.Group; animations: THREE.AnimationClip[] };
  private nativeJumpEnabled = false;
  private readonly performance = new RunnerPerformanceMonitor();
  private readonly audio = new RunnerAudioFeedback();
  private readonly objects: ActiveObject[] = [];
  private readonly pools = new Map<string, ObjectPool<ActiveObject>>();
  private readonly effectPool = new ObjectPool<ActiveObject>(createCollectionEffect);
  private readonly activeEffects: { object: ActiveObject; elapsed: number }[] = [];
  private readonly allEffects = new Set<ActiveObject>();
  private readonly allPooledObjects = new Set<ActiveObject>();
  private readonly cameraPositionTarget = new THREE.Vector3();
  private readonly cameraLookTarget = new THREE.Vector3();
  private readonly cameraLookCurrent = new THREE.Vector3();
  private readonly input: InputController;
  private readonly resizeObserver: ResizeObserver;
  private frame = 0;
  private lastFrameTime = 0;
  private targetLane = 0;
  private jumpProgress = 0;
  private slideRemaining = 0;
  private elapsed = 0;
  private distance = 0;
  private points = 0;
  private balls = 0;
  private spawnDistance = 0;
  private nextSpawnGap: number = RUNNER_CONFIG.spawning.initialGap;
  private lastObstacleType = -1;
  private uiElapsed = 0;
  private performanceElapsed = 0;
  private poorPerformanceSamples = 0;
  private strongPerformanceSamples = 0;
  private lastObstacleLane = 2;
  private lastDistanceMilestone = 0;
  private lastSpeedTier = 4;
  private paused = true;
  private over = false;
  private disposed = false;

  constructor(host: HTMLElement, private readonly callbacks: RunnerEngineCallbacks, environment: "classic" | "club-ground" = "classic") {
    this.host = host;
    this.bundle = createRunnerScene(host);
    if (environment === "club-ground") {
      this.environmentReady = false;
      void loadClubGroundEnvironment(this.bundle).then(() => {
        this.environmentReady = true;
        this.tryStartWhenReady();
      }).catch((error) => {
        console.error("Imported club ground could not load; retaining the original environment.", error);
        this.environmentReady = true;
        this.tryStartWhenReady();
      });
    }
    // Never render the procedural placeholder. Sports Male 03 is the only approved player.
    this.playerCharacter.root.visible = false;
    this.bundle.scene.add(this.playerCharacter.root);
    void this.loadRiggedPlayer();
    this.input = new InputController(this.bundle.renderer.domElement, (action) => this.handleAction(action));
    this.input.attach();
    this.resizeObserver = new ResizeObserver(() => resizeRunnerScene(this.bundle, this.host));
    this.resizeObserver.observe(host);
    this.lastFrameTime = performance.now();
    this.bundle.renderer.render(this.bundle.scene, this.bundle.camera);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private async loadRiggedPlayer(): Promise<void> {
    try {
      const { model, animations: embeddedAnimations } = await loadRunnerCharacter();
      if (this.disposed) {
        disposeRunnerCharacterModel(model);
        return;
      }

      // Install the approved visual model immediately. Animation setup is kept
      // separate so an empty embedded-clip list cannot abort manifest loading.
      this.installRiggedPlayer(model);
      console.info("Sports Male 03 model installed", {
        embeddedClips: embeddedAnimations.map((clip) => clip.name),
        bones: this.countRiggedBones(model),
      });

      // Load the local motion library after the model is visible, then bind it
      // once. This includes the in-place Mixamo run and Quaternius action clips.
      const manifestAnimations = await loadRunnerAnimationManifest(model);
      if (this.disposed || this.loadedPlayerModel !== model) return;
      const animations = [...embeddedAnimations, ...manifestAnimations];
      const availableMotions = new Set(animations.map((clip) => clip.name.toLowerCase()));
      console.info("Sports Male 03 animation loading finished", {
        manifestClips: manifestAnimations.map((clip) => clip.name),
        availableMotions: [...availableMotions],
      });
      const optionalMotions = ["Jump_Start", "Jump_Loop", "Jump_Land", "Crouch_Fwd_Loop", "Slide_Start", "Slide_Loop", "Slide_Exit"];
      const missingOptionalMotions = optionalMotions.filter((name) => !availableMotions.has(name.toLowerCase()));
      if (missingOptionalMotions.length) {
        console.info("Sports Male 03 loaded; optional action clips will use existing fallbacks", missingOptionalMotions);
      }
      const nativeRun = animations.find((clip) => clip.name === "sports-male-03-native-run");
      if (nativeRun) {
        const nativeJumpClips = createNativeBipedJumpClips(model, nativeRun);
        const nativeManeuverClips = createNativeBipedManeuverClips(model, nativeRun);
        // Prefer the approved Sports Male 03-native jump phases over generic
        // library jumps; keep the unrelated run, slide, crouch and kick clips.
        const genericJump = /^(jump_start|jump_loop|jump_land)$/i;
        const compatibleAnimations = animations.filter((clip) => !genericJump.test(clip.name.trim()));
        this.playerAnimator.attachRiggedModel(model, [...nativeJumpClips, ...nativeManeuverClips, ...compatibleAnimations]);
        this.nativeJumpEnabled = true;
        console.info("Approved native Biped jump integrated into Football Runner", {
          takeoff: NATIVE_BIPED_JUMP_PHASES.takeoff,
          airborne: NATIVE_BIPED_JUMP_PHASES.airborne,
          landing: NATIVE_BIPED_JUMP_PHASES.landing,
          total: NATIVE_BIPED_JUMP_PHASES.total,
          nativeManeuvers: nativeManeuverClips.map((clip) => clip.name),
        });
      } else {
        console.warn("Approved native Sports Male 03 run clip unavailable; retaining existing animation set");
        this.playerAnimator.attachRiggedModel(model, animations);
      }

      this.characterReady = true;
      this.tryStartWhenReady();
    } catch (error) {
      console.error("Sports Male 03 failed to load. The game will not substitute the procedural placeholder.", error);
    }
  }

  private countRiggedBones(model: THREE.Object3D): number {
    let count = 0;
    model.traverse((object) => {
      if (object instanceof THREE.Bone) count++;
    });
    return count;
  }

  private installRiggedPlayer(model: THREE.Group): void {
    if (this.disposed) {
      disposeRunnerCharacterModel(model);
      return;
    }
    for (const child of [...this.playerCharacter.root.children]) {
      this.playerCharacter.root.remove(child);
      disposeRunnerCharacterModel(child);
    }
    // Most glTF humanoid assets face +Z; the runner travels toward -Z.
    model.rotation.y = Math.PI;
    this.playerCharacter.root.add(model);
    this.loadedPlayerModel = model;
    this.playerCharacter.root.visible = true;
  }

  private tryStartWhenReady(): void {
    if (this.disposed || !this.startWhenCharacterReady || !this.characterReady || !this.loadedPlayerModel || !this.environmentReady) return;
    this.startWhenCharacterReady = false;
    this.start();
  }

  start = (): void => {
    if (this.disposed) return;
    // Queue the start until both Sports Male 03 and the selected environment are ready.
    if (!this.characterReady || !this.loadedPlayerModel || !this.environmentReady) {
      this.startWhenCharacterReady = true;
      return;
    }
    this.startWhenCharacterReady = false;
    this.releaseAllObjects();
    this.releaseAllEffects();
    this.targetLane = 0;
    this.jumpProgress = 0;
    this.slideRemaining = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.points = 0;
    this.balls = 0;
    this.spawnDistance = 0;
    this.nextSpawnGap = RUNNER_CONFIG.spawning.initialGap;
    this.lastObstacleType = -1;
    this.uiElapsed = 0;
    this.performanceElapsed = 0;
    this.poorPerformanceSamples = 0;
    this.strongPerformanceSamples = 0;
    this.lastObstacleLane = 2;
    this.lastDistanceMilestone = 0;
    this.lastSpeedTier = 4;
    this.over = false;
    if (this.pendingRiggedPlayer) {
      const pending = this.pendingRiggedPlayer;
      this.pendingRiggedPlayer = undefined;
      this.installRiggedPlayer(pending.model);
      this.playerAnimator.attachRiggedModel(pending.model, pending.animations);
    }
    void this.audio.unlock();
    this.audio.setRunning(true);
    this.paused = false;
    this.playerCharacter.root.position.set(0, 0, RUNNER_CONFIG.playerStartZ);
    this.playerAnimator.reset();
    this.bundle.world.position.z = 0;
    this.bundle.camera.position.set(...RUNNER_CONFIG.camera.start);
    this.cameraLookCurrent.set(...RUNNER_CONFIG.camera.lookAt);
    this.bundle.camera.lookAt(this.cameraLookCurrent);

    for (let index = 0; index < RUNNER_CONFIG.spawning.initialRows; index++) {
      this.spawnPattern(-13 - index * RUNNER_CONFIG.spawning.initialSpacing, 0);
    }
    this.callbacks.onHud({ distance: 0, points: 0, balls: 0, speed: 1 });
    this.callbacks.onPhase("running");
    this.startLoop();
  };

  pause = (): void => {
    if (this.disposed || this.over || this.paused) return;
    this.paused = true;
    this.audio.setRunning(false);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.callbacks.onPhase("paused");
  };

  resume = (): void => {
    if (this.disposed || this.over || !this.paused) return;
    this.paused = false;
    void this.audio.unlock();
    this.audio.setRunning(true);
    this.callbacks.onPhase("running");
    this.startLoop();
  };

  restart = (): void => this.start();

  act = (action: RunnerAction): void => this.handleAction(action);

  setSoundEnabled = (enabled: boolean): void => {
    this.audio.setEnabled(enabled);
    if (enabled && !this.paused && !this.over) {
      void this.audio.unlock();
      this.audio.setRunning(true);
    }
  };

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.input.detach();
    this.audio.dispose();
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.releaseAllObjects();
    this.pools.forEach((pool) => pool.clear());
    this.pools.clear();
    this.releaseAllEffects();
    this.effectPool.clear();
    this.allEffects.forEach((object) => this.disposeObject(object));
    this.allEffects.clear();
    if (this.pendingRiggedPlayer) {
      disposeRunnerCharacterModel(this.pendingRiggedPlayer.model);
      this.pendingRiggedPlayer = undefined;
    }
    this.bundle.scene.remove(this.playerCharacter.root);
    this.disposeObject(this.playerCharacter.root);
    this.allPooledObjects.forEach((object) => this.disposeObject(object));
    this.allPooledObjects.clear();
    disposeRunnerScene(this.bundle, this.host);
  };

  private handleAction(action: "left" | "right" | "jump" | "slide"): void {
    if (this.paused || this.over || this.disposed) return;
    if (action === "left") this.targetLane = clamp(this.targetLane - 1, -1, 1);
    if (action === "right") this.targetLane = clamp(this.targetLane + 1, -1, 1);
    if (action === "jump" && this.jumpProgress <= 0 && this.slideRemaining <= 0) {
      this.jumpProgress = RUNNER_CONFIG.movement.jumpDuration;
      this.audio.jump();
    }
    if (action === "slide" && this.jumpProgress <= 0) {
      this.slideRemaining = RUNNER_CONFIG.movement.slideDuration;
      this.audio.slide();
    }
  }

  private getPool(key: string): ObjectPool<ActiveObject> {
    let pool = this.pools.get(key);
    if (!pool) {
      const factory = key === "collectible"
        ? createCollectible
        : () => createObstacle(Number(key.slice("obstacle-".length)));
      pool = new ObjectPool(factory);
      this.pools.set(key, pool);
    }
    return pool;
  }

  private spawnObject(poolKey: string, lane: number, z: number): void {
    const object = this.getPool(poolKey).acquire();
    object.visible = true;
    object.position.set(lane * RUNNER_CONFIG.laneWidth, poolKey === "collectible" ? 0.48 : 0, z);
    object.scale.setScalar(1);
    object.rotation.set(0, 0, 0);
    this.bundle.scene.add(object);
    this.objects.push(object);
    this.allPooledObjects.add(object);
  }

  private releaseObject(object: ActiveObject): void {
    this.bundle.scene.remove(object);
    object.visible = false;
    const key = String(object.userData.poolKey || "");
    this.pools.get(key)?.release(object);
  }

  private releaseAllObjects(): void {
    for (const object of this.objects) this.releaseObject(object);
    this.objects.length = 0;
  }

  private releaseAllEffects(): void {
    for (const effect of this.activeEffects) {
      this.bundle.scene.remove(effect.object);
      effect.object.visible = false;
      this.effectPool.release(effect.object);
    }
    this.activeEffects.length = 0;
  }

  private spawnCollectionEffect(position: THREE.Vector3): void {
    const effect = this.effectPool.acquire();
    effect.visible = true;
    effect.position.copy(position);
    effect.scale.setScalar(1);
    effect.rotation.set(0, 0, 0);
    effect.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const surfaces = Array.isArray(child.material) ? child.material : [child.material];
        surfaces.forEach((surface) => {
          if (surface instanceof THREE.MeshBasicMaterial) surface.opacity = 0.95;
        });
      }
    });
    this.bundle.scene.add(effect);
    this.activeEffects.push({ object: effect, elapsed: 0 });
    this.allEffects.add(effect);
  }

  private updateCollectionEffects(delta: number): void {
    for (let index = this.activeEffects.length - 1; index >= 0; index--) {
      const effect = this.activeEffects[index];
      effect.elapsed += delta;
      const progress = Math.min(1, effect.elapsed / 0.38);
      animateCollectionEffect(effect.object, progress);
      if (progress >= 1) {
        this.bundle.scene.remove(effect.object);
        effect.object.visible = false;
        this.effectPool.release(effect.object);
        this.activeEffects.splice(index, 1);
      }
    }
  }

  private finish(): void {
    if (this.over) return;
    this.over = true;
    this.paused = true;
    this.audio.collision();
    const summary: RunnerSummary = {
      distance: Math.floor(this.distance),
      points: this.points,
      balls: this.balls,
      distancePoints: Math.floor(this.distance * RUNNER_CONFIG.scoring.distancePointsPerMetre),
      footballPoints: this.balls * RUNNER_CONFIG.scoring.footballPickupPoints,
      rewardFootball: 0,
      rewardDistance: 0,
      rewardPerformance: 0,
      sethis: 0,
    };
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.callbacks.onSummary(summary);
    this.callbacks.onPhase("over");
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden" && !this.paused && !this.over) this.pause();
  };

  private startLoop(): void {
    if (this.disposed || this.paused || this.over || this.frame) return;
    this.lastFrameTime = performance.now();
    this.frame = requestAnimationFrame(this.animate);
  }

  private animate = (now: number): void => {
    if (this.disposed) return;
    const rawDelta = Math.max(0, (now - this.lastFrameTime) / 1000);
    const delta = Math.min(0.04, rawDelta);
    this.lastFrameTime = now;
    this.performance.record(rawDelta);
    this.performanceElapsed += rawDelta;
    if (this.performanceElapsed >= 5) {
      this.performanceElapsed = 0;
      const snapshot = this.performance.takeSnapshot();
      this.adjustRenderQuality(snapshot);
      this.callbacks.onPerformance?.(snapshot);
    }
    if (!this.paused && !this.over) this.update(delta);
    this.bundle.renderer.render(this.bundle.scene, this.bundle.camera);
    if (!this.paused && !this.over) this.frame = requestAnimationFrame(this.animate);
    else this.frame = 0;
  };

  private adjustRenderQuality(snapshot: RunnerPerformanceSnapshot): void {
    if (snapshot.framesSampled < 30) return;
    const struggling = snapshot.fps < 42 || snapshot.averageFrameMs > 24 || snapshot.slowFrameRatio > 0.35;
    const headroom = snapshot.fps >= 57 && snapshot.averageFrameMs < 18 && snapshot.slowFrameRatio < 0.08;
    this.poorPerformanceSamples = struggling ? this.poorPerformanceSamples + 1 : 0;
    this.strongPerformanceSamples = headroom ? this.strongPerformanceSamples + 1 : 0;

    if (this.poorPerformanceSamples >= 2) {
      const next: RunnerRenderQuality = this.bundle.renderQuality === "high" ? "balanced" : "low";
      if (next !== this.bundle.renderQuality) applyRunnerRenderQuality(this.bundle, next);
      this.poorPerformanceSamples = 0;
      this.strongPerformanceSamples = 0;
      return;
    }
    if (this.strongPerformanceSamples >= 3) {
      const next: RunnerRenderQuality = this.bundle.renderQuality === "low" ? "balanced" : "high";
      if (next !== this.bundle.renderQuality) applyRunnerRenderQuality(this.bundle, next);
      this.strongPerformanceSamples = 0;
      this.poorPerformanceSamples = 0;
    }
  }

  private update(delta: number): void {
    const config = RUNNER_CONFIG;
    this.elapsed += delta;
    this.updateCollectionEffects(delta);
    const speed = Math.min(config.movement.maximumSpeed, getRunSpeed(this.elapsed));
    this.audio.updateRun(delta, speed / config.movement.initialSpeed);
    this.distance += speed * delta;
    const distanceTier = Math.floor(this.distance / 250);
    if (distanceTier > this.lastDistanceMilestone) {
      this.lastDistanceMilestone = distanceTier;
      this.audio.milestone("distance");
    }
    const speedTier = Math.floor((speed / config.movement.initialSpeed) * 4);
    if (speedTier > this.lastSpeedTier && speedTier >= 6) {
      this.lastSpeedTier = speedTier;
      this.audio.milestone("speed");
    }
    this.points = Math.floor(this.distance * config.scoring.distancePointsPerMetre) + this.balls * config.scoring.footballPickupPoints;
    this.spawnDistance += speed * delta;
    this.bundle.world.position.z = (this.bundle.world.position.z + speed * delta) % config.world.length;

    const player = this.playerCharacter.root;
    const laneTarget = this.targetLane * config.laneWidth;
    const laneBlend = 1 - Math.exp(-config.movement.laneResponse * delta);
    player.position.x += (laneTarget - player.position.x) * laneBlend;
    if (Math.abs(laneTarget - player.position.x) < config.movement.laneSnapTolerance) player.position.x = laneTarget;

    if (this.jumpProgress > 0) {
      this.jumpProgress = Math.max(0, this.jumpProgress - delta);
      player.position.y = Math.sin((config.movement.jumpDuration - this.jumpProgress) * Math.PI / config.movement.jumpDuration) * config.movement.jumpHeight;
    } else {
      player.position.y = 0;
    }
    this.slideRemaining = Math.max(0, this.slideRemaining - delta);
    this.playerAnimator.update(delta, {
      speedRatio: speed / config.movement.initialSpeed,
      // Start the landing pose during the final 0.32s of the existing
      // 1.02s root arc, so the animation finishes as the player reaches ground.
      jumping: this.jumpProgress > (this.nativeJumpEnabled ? NATIVE_BIPED_JUMP_PHASES.landing : 0.05),
      sliding: this.slideRemaining > 0,
      laneLean: clamp(this.targetLane - player.position.x / config.laneWidth, -1, 1),
    });
    this.updateChaseCamera(delta, player.position);

    const difficulty = this.getDifficulty();
    if (this.spawnDistance >= this.nextSpawnGap) {
      this.spawnDistance -= this.nextSpawnGap;
      this.spawnPattern(-config.spawning.startDistance, difficulty);
      const reactionSeconds = config.spawning.reactionSecondsStart
        - (config.spawning.reactionSecondsStart - config.spawning.reactionSecondsMinimum) * difficulty;
      this.nextSpawnGap = clamp(
        speed * reactionSeconds,
        config.spawning.gapMinimum,
        config.spawning.gapMaximum,
      );
    }

    for (let index = this.objects.length - 1; index >= 0; index--) {
      const object = this.objects[index];
      object.position.z += speed * delta;
      if (object.userData.kind === "ball") object.rotation.y += delta * 2.4;
      if (object.position.z > 3.2) {
        this.releaseObject(object);
        this.objects.splice(index, 1);
        continue;
      }

      const hitbox = object.userData.hitbox as {
        halfWidth: number;
        halfDepth: number;
        height: number;
        clearance?: "jump" | "slide" | "none";
        clearanceHeight?: number;
        slideClearanceHeight?: number;
      } | undefined;
      const depthLimit = (hitbox?.halfDepth ?? 0.35) + config.collision.playerHalfDepth;
      const widthLimit = (hitbox?.halfWidth ?? 0.35) + config.collision.playerHalfWidth;
      const depth = Math.abs(object.position.z - player.position.z);
      const width = Math.abs(object.position.x - player.position.x);
      if (depth < depthLimit && width < widthLimit) {
        if (object.userData.kind === "ball") {
          this.balls++;
          this.points = Math.floor(this.distance * config.scoring.distancePointsPerMetre) + this.balls * config.scoring.footballPickupPoints;
          // Collection is a score/effect event, not a locomotion action.
          // Keep the native run cycle uninterrupted as the player passes through the ball.
          this.audio.collect();
          this.spawnCollectionEffect(object.position);
          this.callbacks.onHud({
            distance: Math.floor(this.distance),
            points: this.points,
            balls: this.balls,
            speed: Math.round((speed / config.movement.initialSpeed) * 10) / 10,
          });
          this.releaseObject(object);
          this.objects.splice(index, 1);
        } else {
          const jumpClears = hitbox?.clearance === "jump"
            && player.position.y >= (hitbox.clearanceHeight ?? hitbox.height + config.collision.clearanceMargin);
          const slideClears = hitbox?.clearance === "slide"
            && this.slideRemaining > 0
            && config.collision.slidingPlayerHeight <= (hitbox.slideClearanceHeight ?? 1.1);
          if (!jumpClears && !slideClears) {
            this.finish();
            break;
          }
        }
      }
    }

    this.uiElapsed += delta;
    if (this.uiElapsed >= config.ui.updateInterval) {
      this.uiElapsed = 0;
      this.callbacks.onHud({
        distance: Math.floor(this.distance),
        points: this.points,
        balls: this.balls,
        speed: Math.round((speed / config.movement.initialSpeed) * 10) / 10,
      });
    }
  }

  private getDifficulty(): number {
    return clamp(this.distance / RUNNER_CONFIG.spawning.fullDifficultyDistance, 0, 1);
  }

  private nextObstacleVariant(): number {
    const choices = [0, 1, 2, 3, 4].filter((variant) => variant !== this.lastObstacleType);
    const selected = choices[Math.floor(Math.random() * choices.length)] ?? 0;
    this.lastObstacleType = selected;
    return selected;
  }

  private spawnPattern(z: number, difficulty: number): void {
    const config = RUNNER_CONFIG.spawning;
    const lanes = [-1, 0, 1];
    const ballRowChance = config.ballChanceStart
      - (config.ballChanceStart - config.ballChanceMinimum) * difficulty;

    if (Math.random() < ballRowChance) {
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const count = Math.random() < config.longBallLineChance ? 3 : 2;
      for (let index = 0; index < count; index++) {
        this.spawnObject("collectible", lane, z - index * config.ballLineSpacing);
      }
      return;
    }

    const doubleObstacleChance = config.doubleObstacleChanceStart
      + (config.doubleObstacleChanceMaximum - config.doubleObstacleChanceStart) * difficulty;
    const obstacleCount = Math.random() < doubleObstacleChance ? 2 : 1;
    const laneOptions = obstacleCount === 1 ? lanes.filter((lane) => lane !== this.lastObstacleLane) : lanes;
    const shuffled = [...laneOptions].sort(() => Math.random() - 0.5);
    const blockedLanes = shuffled.slice(0, obstacleCount);

    // One or two lanes may be challenged, but at least one complete lane stays open.
    for (const lane of blockedLanes) {
      const variant = this.nextObstacleVariant();
      this.spawnObject(`obstacle-${variant}`, lane, z);
      this.lastObstacleLane = lane;
    }

    // A small football line sometimes rewards taking the remaining safe route.
    if (Math.random() < config.safeLaneBallChance) {
      const safeLane = lanes.find((lane) => !blockedLanes.includes(lane));
      if (safeLane !== undefined) {
        this.spawnObject("collectible", safeLane, z - config.safeLaneBallOffset);
      }
    }
  }

  private updateChaseCamera(delta: number, playerPosition: THREE.Vector3): void {
    const cameraConfig = RUNNER_CONFIG.camera;
    const positionBlend = 1 - Math.exp(-cameraConfig.positionDamping * delta);
    const targetBlend = 1 - Math.exp(-cameraConfig.targetDamping * delta);
    this.cameraPositionTarget.set(
      playerPosition.x * 0.28,
      cameraConfig.followHeight + playerPosition.y * 0.16,
      playerPosition.z + cameraConfig.followDistance,
    );
    this.bundle.camera.position.lerp(this.cameraPositionTarget, positionBlend);
    this.cameraLookTarget.set(
      playerPosition.x * 0.12,
      1.22 + playerPosition.y * 0.22,
      playerPosition.z - cameraConfig.lookAhead,
    );
    this.cameraLookCurrent.lerp(this.cameraLookTarget, targetBlend);
    this.bundle.camera.lookAt(this.cameraLookCurrent);
  }

  private disposeObject(root: THREE.Object3D): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const surfaces = Array.isArray(object.material) ? object.material : [object.material];
      surfaces.forEach((surface) => {
        materials.add(surface);
        Object.values(surface).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      });
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((surface) => surface.dispose());
    textures.forEach((texture) => texture.dispose());
  }
}
