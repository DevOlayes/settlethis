import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";
import { clamp, getDemoReward, getRunSpeed } from "./math";
import { InputController } from "./InputController";
import { ObjectPool } from "./ObjectPool";
import { createCollectible, createObstacle } from "./EntityFactory";
import { createPlayerCharacter } from "./PlayerCharacter";
import { PlayerAnimator } from "./PlayerAnimator";
import { RunnerPerformanceMonitor } from "./PerformanceMonitor";
import { createRunnerScene, disposeRunnerScene, resizeRunnerScene } from "./SceneFactory";
import type { RunnerAction, RunnerEngineCallbacks, RunnerPhase, RunnerSceneBundle, RunnerSummary } from "./types";

type ActiveObject = THREE.Group;

export class RunnerEngine {
  private readonly bundle: RunnerSceneBundle;
  private readonly host: HTMLElement;
  private readonly playerCharacter = createPlayerCharacter();
  private readonly playerAnimator = new PlayerAnimator(this.playerCharacter);
  private readonly performance = new RunnerPerformanceMonitor();
  private readonly objects: ActiveObject[] = [];
  private readonly pools = new Map<string, ObjectPool<ActiveObject>>();
  private readonly allPooledObjects = new Set<ActiveObject>();
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
  private spawnElapsed = 0;
  private uiElapsed = 0;
  private performanceElapsed = 0;
  private obstacleIndex = 0;
  private paused = true;
  private over = false;
  private disposed = false;

  constructor(host: HTMLElement, private readonly callbacks: RunnerEngineCallbacks) {
    this.host = host;
    this.bundle = createRunnerScene(host);
    this.bundle.scene.add(this.playerCharacter.root);
    this.input = new InputController(this.bundle.renderer.domElement, (action) => this.handleAction(action));
    this.input.attach();
    this.resizeObserver = new ResizeObserver(() => resizeRunnerScene(this.bundle, this.host));
    this.resizeObserver.observe(host);
    this.lastFrameTime = performance.now();
    this.bundle.renderer.render(this.bundle.scene, this.bundle.camera);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  start = (): void => {
    if (this.disposed) return;
    this.releaseAllObjects();
    this.targetLane = 0;
    this.jumpProgress = 0;
    this.slideRemaining = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.points = 0;
    this.balls = 0;
    this.spawnElapsed = 0;
    this.uiElapsed = 0;
    this.performanceElapsed = 0;
    this.obstacleIndex = 0;
    this.over = false;
    this.paused = false;
    this.playerCharacter.root.position.set(0, 0, RUNNER_CONFIG.playerStartZ);
    this.playerAnimator.reset();
    this.bundle.world.position.z = 0;

    for (let index = 0; index < RUNNER_CONFIG.spawning.initialObjects; index++) {
      const z = -13 - index * RUNNER_CONFIG.spawning.initialSpacing;
      const lane = (index % 3) - 1;
      this.spawnObject(index % 2 === 0 ? "collectible" : `obstacle-${this.obstacleIndex++ % 3}`, lane, z);
    }
    this.callbacks.onHud({ distance: 0, points: 0, balls: 0, speed: 1 });
    this.callbacks.onPhase("running");
    this.startLoop();
  };

  pause = (): void => {
    if (this.disposed || this.over || this.paused) return;
    this.paused = true;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.callbacks.onPhase("paused");
  };

  resume = (): void => {
    if (this.disposed || this.over || !this.paused) return;
    this.paused = false;
    this.callbacks.onPhase("running");
    this.startLoop();
  };

  restart = (): void => this.start();

  act = (action: RunnerAction): void => this.handleAction(action);

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.input.detach();
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.releaseAllObjects();
    this.pools.forEach((pool) => pool.clear());
    this.pools.clear();
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
    }
    if (action === "slide" && this.jumpProgress <= 0) {
      this.slideRemaining = RUNNER_CONFIG.movement.slideDuration;
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

  private finish(): void {
    if (this.over) return;
    this.over = true;
    this.paused = true;
    const sethis = getDemoReward(this.balls, this.distance, this.points);
    const summary: RunnerSummary = {
      distance: Math.floor(this.distance),
      points: this.points,
      balls: this.balls,
      sethis,
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
      this.callbacks.onPerformance?.(this.performance.takeSnapshot());
    }
    if (!this.paused && !this.over) this.update(delta);
    this.bundle.renderer.render(this.bundle.scene, this.bundle.camera);
    if (!this.paused && !this.over) this.frame = requestAnimationFrame(this.animate);
    else this.frame = 0;
  };

  private update(delta: number): void {
    const config = RUNNER_CONFIG;
    this.elapsed += delta;
    const speed = Math.min(config.movement.maximumSpeed, getRunSpeed(this.elapsed));
    this.distance += speed * delta;
    this.points += Math.floor(speed * delta * 12);
    this.spawnElapsed += delta;
    this.bundle.world.position.z = (this.bundle.world.position.z + speed * delta) % 15;

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
      jumping: this.jumpProgress > 0.05,
      sliding: this.slideRemaining > 0,
      laneLean: clamp(this.targetLane - player.position.x / config.laneWidth, -1, 1),
    });

    if (this.spawnElapsed > Math.max(
      config.spawning.intervalMinimum,
      config.spawning.intervalStart - this.elapsed * config.spawning.intervalRamp,
    )) {
      this.spawnElapsed = 0;
      const lane = Math.floor(Math.random() * 3) - 1;
      if (Math.random() < config.spawning.ballChance) {
        this.spawnObject("collectible", lane, -config.spawning.startDistance);
      } else {
        this.spawnObject(`obstacle-${this.obstacleIndex++ % 3}`, lane, -config.spawning.startDistance);
      }
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

      const depth = Math.abs(object.position.z - player.position.z);
      const width = Math.abs(object.position.x - player.position.x);
      if (depth < config.collision.depth && width < config.collision.width) {
        if (object.userData.kind === "ball") {
          this.balls++;
          this.points += 100;
          this.playerAnimator.triggerKick();
          this.releaseObject(object);
          this.objects.splice(index, 1);
        } else if (!(this.jumpProgress > 0.05 && object.userData.obstacleType === "hurdle") && this.slideRemaining <= 0) {
          this.finish();
          break;
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

  private disposeObject(root: THREE.Object3D): void {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
  }
}
