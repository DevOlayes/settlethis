import * as THREE from "three";
import type { PlayerCharacter } from "./PlayerCharacter";

export type PlayerAnimationInput = {
  speedRatio: number;
  jumping: boolean;
  sliding: boolean;
  laneLean: number;
};

type RunnerMotion = "run" | "sprint" | "jump" | "slide" | "crouch" | "kick";

const CLIP_PATTERNS: Record<RunnerMotion, RegExp[]> = {
  run: [/\\brun\\b/, /jog/, /\\bwalk\\b/, /locomotion/],
  sprint: [/sprint/, /fast.?run/, /run.?fast/],
  jump: [/jump/, /hop/, /take.?off/, /airborne/],
  slide: [/slide/, /sliding/, /low.?slide/, /roll/],
  crouch: [/crouch/, /duck/, /low.?walk/, /sneak/],
  kick: [/soccer.?kick/, /football.?kick/, /kick/, /shoot/, /pass/, /strike/],
};

const ONESHOT_MOTIONS = new Set<RunnerMotion>(["jump", "slide", "kick"]);

export class PlayerAnimator {
  private runClock = 0;
  private kickElapsed = 10;
  private landingPulse = 0;
  private previousJumping = false;
  private riggedMixer?: THREE.AnimationMixer;
  private riggedActions = new Map<string, THREE.AnimationAction>();
  private actionByMotion = new Map<RunnerMotion, THREE.AnimationAction>();
  private activeRiggedAction?: THREE.AnimationAction;
  private activeRiggedMotion?: RunnerMotion;
  private riggedKickRemaining = 0;
  private riggedSlideRemaining = 0;
  private riggedJumping = false;

  constructor(private readonly character: PlayerCharacter) {}

  attachRiggedModel(model: THREE.Object3D, clips: THREE.AnimationClip[]): void {
    this.riggedMixer?.stopAllAction();
    this.riggedMixer = new THREE.AnimationMixer(model);
    this.riggedActions.clear();
    this.actionByMotion.clear();
    this.activeRiggedAction = undefined;
    this.activeRiggedMotion = undefined;

    for (const clip of clips) {
      const key = clip.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key) continue;
      const action = this.riggedMixer.clipAction(clip);
      this.riggedActions.set(key, action);
    }

    // Prefer dedicated locomotion clips; never use a one-shot kick/slide as a run.
    for (const motion of ["run", "sprint", "jump", "crouch", "slide", "kick"] as RunnerMotion[]) {
      const patterns = CLIP_PATTERNS[motion];
      for (const [name, action] of this.riggedActions) {
        if (patterns.some((pattern) => pattern.test(name))) {
          this.actionByMotion.set(motion, action);
          break;
        }
      }
    }
    this.playRiggedMotion("run");
  }

  private playRiggedMotion(motion: RunnerMotion): void {
    if (!this.riggedMixer) return;
    let next = this.actionByMotion.get(motion);

    // Missing special clips should preserve the active run cycle, not restart it
    // as a one-shot animation. A crouch can be used as a temporary slide fallback.
    if (!next && motion === "slide") next = this.actionByMotion.get("crouch");
    if (!next && motion === "sprint") next = this.actionByMotion.get("run");
    if (!next && motion !== "run") return;
    if (!next) return;

    if (next === this.activeRiggedAction && motion === this.activeRiggedMotion) return;
    const previous = this.activeRiggedAction;
    next.reset();
    next.enabled = true;
    next.paused = false;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    if (ONESHOT_MOTIONS.has(motion) && next !== this.actionByMotion.get("run")) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.fadeIn(previous ? 0.16 : 0);
    next.play();
    if (previous && previous !== next) previous.fadeOut(0.16);
    this.activeRiggedAction = next;
    this.activeRiggedMotion = motion;
  }

  private chooseRiggedMotion(input: PlayerAnimationInput): RunnerMotion {
    if (this.riggedKickRemaining > 0 && this.actionByMotion.has("kick")) return "kick";
    if (input.sliding) {
      if (this.actionByMotion.has("slide")) return "slide";
      if (this.actionByMotion.has("crouch")) return "crouch";
      return "run";
    }
    if (input.jumping && this.actionByMotion.has("jump")) return "jump";
    if (input.speedRatio > 1.22 && this.actionByMotion.has("sprint")) return "sprint";
    return "run";
  }

  private updateRigged(delta: number, input: PlayerAnimationInput): void {
    if (!this.riggedMixer) return;
    this.riggedKickRemaining = Math.max(0, this.riggedKickRemaining - delta);
    this.riggedSlideRemaining = Math.max(0, this.riggedSlideRemaining - delta);
    this.riggedJumping = input.jumping;

    const motion = this.chooseRiggedMotion(input);
    this.playRiggedMotion(motion);

    if (this.activeRiggedAction && (motion === "run" || motion === "sprint")) {
      this.activeRiggedAction.setEffectiveTimeScale(
        THREE.MathUtils.clamp(input.speedRatio, 0.82, 1.55),
      );
    }

    // Root lean and counter-rotation give lane changes weight without moving
    // the gameplay root away from its collision lane.
    this.character.root.rotation.z = THREE.MathUtils.damp(
      this.character.root.rotation.z, -input.laneLean * 0.15, 9, delta,
    );
    this.character.root.rotation.y = THREE.MathUtils.damp(
      this.character.root.rotation.y, input.laneLean * 0.09, 9, delta,
    );
    this.riggedMixer.update(delta);
  }

  reset(): void {
    this.runClock = 0;
    this.kickElapsed = 10;
    this.landingPulse = 0;
    this.previousJumping = false;
    this.riggedKickRemaining = 0;
    this.riggedSlideRemaining = 0;
    this.riggedJumping = false;
    this.activeRiggedMotion = undefined;
    this.activeRiggedAction = undefined;
    this.riggedMixer?.stopAllAction();
    if (this.riggedMixer) this.playRiggedMotion("run");
    this.character.root.rotation.set(0, 0, 0);
    this.character.torso.rotation.set(0, 0, 0);
    this.character.pelvis.rotation.set(0, 0, 0);
    this.character.pelvis.position.y = 0.98;
    this.character.torso.scale.set(1, 1, 1);
    this.character.torso.position.y = 1.52;
    this.character.head.rotation.set(0, 0, 0);
    this.character.leftArm.rotation.set(0, 0, 0);
    this.character.rightArm.rotation.set(0, 0, 0);
    this.character.leftForearm.rotation.set(0, 0, 0);
    this.character.rightForearm.rotation.set(0, 0, 0);
    this.character.leftThigh.rotation.set(0, 0, 0);
    this.character.rightThigh.rotation.set(0, 0, 0);
    this.character.leftKnee.rotation.set(0, 0, 0);
    this.character.rightKnee.rotation.set(0, 0, 0);
    this.character.leftFoot.rotation.set(0, 0, 0);
    this.character.rightFoot.rotation.set(0, 0, 0);
  }

  triggerKick(): void {
    this.kickElapsed = 0;
    if (this.riggedMixer && this.actionByMotion.has("kick")) this.riggedKickRemaining = 0.48;
  }

  update(delta: number, input: PlayerAnimationInput): void {
    if (this.riggedMixer) {
      this.updateRigged(delta, input);
      return;
    }

    // Existing fallback animation remains active until the real rigged model
    // and its compatible motion clips are bundled and verified.
    const c = this.character;
    const speed = THREE.MathUtils.clamp(input.speedRatio, 0.8, 1.65);
    this.runClock += delta * (8.8 * speed);
    const gait = Math.sin(this.runClock);
    const opposite = Math.sin(this.runClock + Math.PI);

    if (this.previousJumping && !input.jumping) this.landingPulse = 1;
    this.previousJumping = input.jumping;
    this.landingPulse = Math.max(0, this.landingPulse - delta * 3.8);
    this.kickElapsed = Math.min(10, this.kickElapsed + delta);

    const kickActive = this.kickElapsed < 0.42;
    const kickWeight = kickActive ? Math.sin((this.kickElapsed / 0.42) * Math.PI) : 0;
    const jumpWeight = input.jumping ? 1 : 0;
    const slideWeight = input.sliding ? 1 : 0;

    c.leftThigh.rotation.x = gait * 0.58 * (1 - jumpWeight * 0.5) + jumpWeight * -0.28;
    c.rightThigh.rotation.x = opposite * 0.58 * (1 - jumpWeight * 0.5) + jumpWeight * -0.28;
    c.leftKnee.rotation.x = Math.max(0, -gait) * 0.82 + jumpWeight * 0.72 + slideWeight * 1.18;
    c.rightKnee.rotation.x = Math.max(0, -opposite) * 0.82 + jumpWeight * 0.72 + slideWeight * 1.18;
    c.leftThigh.rotation.x = THREE.MathUtils.lerp(c.leftThigh.rotation.x, -0.82, slideWeight * 0.9);
    c.rightThigh.rotation.x = THREE.MathUtils.lerp(c.rightThigh.rotation.x, -0.82, slideWeight * 0.9);
    c.leftFoot.rotation.x = -Math.max(0, gait) * 0.2;
    c.rightFoot.rotation.x = -Math.max(0, opposite) * 0.2;

    c.leftArm.rotation.x = -gait * 0.42 - jumpWeight * 0.28 + slideWeight * 0.42;
    c.rightArm.rotation.x = -opposite * 0.42 - jumpWeight * 0.28 + slideWeight * 0.42;
    c.leftArm.rotation.z = -0.08 - slideWeight * 0.15;
    c.rightArm.rotation.z = 0.08 + slideWeight * 0.15;
    c.leftForearm.rotation.x = -0.32 - Math.max(0, gait) * 0.2 - slideWeight * 0.28;
    c.rightForearm.rotation.x = -0.32 - Math.max(0, opposite) * 0.2 - slideWeight * 0.28;

    c.root.rotation.z = THREE.MathUtils.damp(c.root.rotation.z, -input.laneLean * 0.13, 8, delta);
    c.torso.rotation.x = THREE.MathUtils.damp(c.torso.rotation.x, slideWeight * 0.72 - jumpWeight * 0.12, 10, delta);
    c.pelvis.rotation.x = THREE.MathUtils.damp(c.pelvis.rotation.x, slideWeight * -0.3, 10, delta);
    c.pelvis.position.y = THREE.MathUtils.damp(c.pelvis.position.y, 0.98 - slideWeight * 0.2, 12, delta);
    c.root.rotation.y = THREE.MathUtils.damp(c.root.rotation.y, input.laneLean * 0.075, 9, delta);
    const runningBounce = Math.abs(Math.sin(this.runClock * 2)) * 0.035;
    c.torso.position.y = 1.52 + runningBounce - slideWeight * 0.22 + jumpWeight * 0.05;
    c.pelvis.rotation.z = THREE.MathUtils.damp(c.pelvis.rotation.z, input.laneLean * 0.055, 9, delta);
    c.head.rotation.z = THREE.MathUtils.damp(c.head.rotation.z, -input.laneLean * 0.035, 8, delta);
    c.head.rotation.x = slideWeight * -0.12;
    c.torso.scale.y = 1 - this.landingPulse * 0.07;
    c.torso.scale.x = 1 + this.landingPulse * 0.025;

    if (kickActive) {
      const strike = kickWeight;
      c.rightThigh.rotation.x = THREE.MathUtils.lerp(c.rightThigh.rotation.x, -1.05, strike);
      c.rightKnee.rotation.x = THREE.MathUtils.lerp(c.rightKnee.rotation.x, -0.12, strike);
      c.rightFoot.rotation.x = THREE.MathUtils.lerp(c.rightFoot.rotation.x, 0.34, strike);
      c.torso.rotation.y = THREE.MathUtils.lerp(c.torso.rotation.y, -0.14, strike);
      c.leftArm.rotation.x -= strike * 0.3;
      c.rightArm.rotation.x += strike * 0.55;
    } else {
      c.torso.rotation.y = THREE.MathUtils.damp(c.torso.rotation.y, 0, 8, delta);
    }
  }
}
