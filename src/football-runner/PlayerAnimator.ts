import * as THREE from "three";
import type { PlayerCharacter } from "./PlayerCharacter";
import { canonicalizeBoneName } from "@three-ws/retarget";

export type PlayerAnimationInput = {
  speedRatio: number;
  jumping: boolean;
  sliding: boolean;
  laneLean: number;
};

type RunnerMotion = "run" | "sprint" | "jumpTakeoff" | "jumpAir" | "jumpLand" | "slideStart" | "slideLoop" | "slideEnd" | "crouch" | "kick";

const CLIP_PATTERNS: Record<RunnerMotion, RegExp[]> = {
  run: [/\\brun\\b/, /jog/, /\\bwalk\\b/, /locomotion/],
  sprint: [/sprint/, /fast.?run/, /run.?fast/],
  jumpTakeoff: [/jump.?take.?off/, /take.?off/, /jump.?start/],
  jumpAir: [/jump.?air/, /airborne/, /jump.?loop/, /in.?air/],
  jumpLand: [/jump.?land/, /landing/, /land.?jump/],
  slideStart: [/slide.?start/],
  slideLoop: [/slide.?loop/, /sliding/],
  slideEnd: [/slide.?exit/, /slide.?end/],
  crouch: [/crouch.?fwd/, /crouch.?walk/, /crouch/, /duck/, /low.?walk/, /sneak/],
  kick: [/soccer.?kick/, /football.?kick/, /kick/, /shoot/, /pass/, /strike/],
};

const ONESHOT_MOTIONS = new Set<RunnerMotion>(["jumpTakeoff", "jumpLand", "slideStart", "slideEnd", "kick"]);

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
  private previousSliding = false;
  private slideElapsed = 0;
  private slideExitRemaining = 0;
  private riggedJumping = false;
  private jumpPhaseElapsed = 0;
  private landingRemaining = 0;

  constructor(private readonly character: PlayerCharacter) {}

  attachRiggedModel(model: THREE.Object3D, sourceClips: THREE.AnimationClip[]): void {
    const clips = [...sourceClips];
    if (!clips.some((clip) => /soccer.?kick|football.?kick/i.test(clip.name))) {
      const authoredKick = createFootballKickClip(model);
      if (authoredKick) clips.push(authoredKick);
    }
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
    for (const motion of ["run", "sprint", "jumpTakeoff", "jumpAir", "jumpLand", "crouch", "slideStart", "slideLoop", "slideEnd", "kick"] as RunnerMotion[]) {
      const patterns = CLIP_PATTERNS[motion];
      for (const pattern of patterns) {
        const match = [...this.riggedActions].find(([name]) => pattern.test(name));
        if (match) {
          this.actionByMotion.set(motion, match[1]);
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
    if (!next && (motion === "slideStart" || motion === "slideLoop" || motion === "slideEnd")) next = this.actionByMotion.get("crouch");
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
    const loopOnce = ONESHOT_MOTIONS.has(motion) && !(motion.startsWith("slide") && next === this.actionByMotion.get("crouch"));
    if (loopOnce && next !== this.actionByMotion.get("run")) {
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
      const slideStartDuration = this.actionByMotion.get("slideStart")?.getClip().duration ?? 0.24;
      if (this.slideElapsed < Math.min(0.36, Math.max(0.18, slideStartDuration * 0.42)) && this.actionByMotion.has("slideStart")) return "slideStart";
      if (this.actionByMotion.has("slideLoop")) return "slideLoop";
      if (this.actionByMotion.has("slideStart")) return "slideStart";
      if (this.actionByMotion.has("crouch")) return "crouch";
      return "run";
    }
    if (this.slideExitRemaining > 0 && this.actionByMotion.has("slideEnd")) return "slideEnd";

    if (input.jumping) {
      const takeoffDuration = this.actionByMotion.get("jumpTakeoff")?.getClip().duration ?? 0.3;
      if (this.jumpPhaseElapsed < Math.min(0.38, Math.max(0.18, takeoffDuration * 0.35)) && this.actionByMotion.has("jumpTakeoff")) return "jumpTakeoff";
      if (this.actionByMotion.has("jumpAir")) return "jumpAir";
      if (this.actionByMotion.has("jumpTakeoff")) return "jumpTakeoff";
    }
    if (this.landingRemaining > 0 && this.actionByMotion.has("jumpLand")) return "jumpLand";
    if (input.speedRatio > 1.22 && this.actionByMotion.has("sprint")) return "sprint";
    return "run";
  }

  private updateRigged(delta: number, input: PlayerAnimationInput): void {
    if (!this.riggedMixer) return;
    this.riggedKickRemaining = Math.max(0, this.riggedKickRemaining - delta);

    if (input.sliding && !this.previousSliding) {
      this.slideElapsed = 0;
      this.slideExitRemaining = 0;
    }
    if (input.sliding) this.slideElapsed += delta;
    if (!input.sliding && this.previousSliding) {
      const exitDuration = this.actionByMotion.get("slideEnd")?.getClip().duration ?? 0.3;
      this.slideExitRemaining = Math.max(0.24, Math.min(0.65, exitDuration));
    }
    this.previousSliding = input.sliding;
    this.slideExitRemaining = Math.max(0, this.slideExitRemaining - (input.sliding ? 0 : delta));

    if (input.jumping && !this.riggedJumping) this.jumpPhaseElapsed = 0;
    if (input.jumping) this.jumpPhaseElapsed += delta;
    if (!input.jumping && this.riggedJumping) {
      const landDuration = this.actionByMotion.get("jumpLand")?.getClip().duration ?? 0.32;
      this.landingRemaining = Math.max(0.24, Math.min(0.55, landDuration));
    }
    else this.landingRemaining = Math.max(0, this.landingRemaining - delta);
    this.riggedJumping = input.jumping;

    const motion = this.chooseRiggedMotion(input);
    this.playRiggedMotion(motion);

    if (this.activeRiggedAction && (motion === "run" || motion === "sprint")) {
      this.activeRiggedAction.setEffectiveTimeScale(
        THREE.MathUtils.clamp(input.speedRatio, 0.82, 1.55),
      );
    }

    // The gameplay root remains on its lane; the upper body banks into the turn.
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
    this.previousSliding = false;
    this.slideElapsed = 0;
    this.slideExitRemaining = 0;
    this.riggedJumping = false;
    this.jumpPhaseElapsed = 0;
    this.landingRemaining = 0;
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
    if (this.riggedMixer && this.actionByMotion.has("kick")) {
      this.riggedKickRemaining = this.actionByMotion.get("kick")?.getClip().duration ?? 0.68;
    }
  }

function createFootballKickClip(model: THREE.Object3D): THREE.AnimationClip | null {
  const bones = new Map<string, THREE.Bone>();
  model.traverse((object) => {
    if (object instanceof THREE.Bone) {
      bones.set(canonicalizeBoneName(object.name), object);
    }
  });

  const times = [0, 0.12, 0.25, 0.37, 0.53, 0.68];
  const tracks: THREE.KeyframeTrack[] = [];
  const addRotation = (
    canonicalName: string,
    poses: Array<[number, number, number]>,
  ) => {
    const bone = bones.get(canonicalName);
    if (!bone) return;
    const base = bone.quaternion.clone();
    const values: number[] = [];
    for (const [x, y, z] of poses) {
      const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
      const result = base.clone().multiply(delta).normalize();
      values.push(result.x, result.y, result.z, result.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(
      `${bone.name}.quaternion`, times, values,
    ));
  };

  // Original in-place football collection kick: wind-up, strike, follow-through, recovery.
  addRotation("RightUpLeg", [
    [0, 0, 0], [0.48, 0, 0.08], [-0.92, 0, 0.04],
    [-0.72, 0, 0.02], [-0.22, 0, 0], [0, 0, 0],
  ]);
  addRotation("RightLeg", [
    [0, 0, 0], [0.72, 0, 0], [0.12, 0, 0],
    [-0.16, 0, 0], [0.12, 0, 0], [0, 0, 0],
  ]);
  addRotation("RightFoot", [
    [0, 0, 0], [0.12, 0, 0], [-0.24, 0, 0],
    [-0.08, 0, 0], [0.08, 0, 0], [0, 0, 0],
  ]);
  addRotation("LeftUpLeg", [
    [0, 0, 0], [0.05, 0, 0], [0.12, 0, 0],
    [0.1, 0, 0], [0.03, 0, 0], [0, 0, 0],
  ]);
  addRotation("LeftLeg", [
    [0, 0, 0], [0.08, 0, 0], [0.2, 0, 0],
    [0.16, 0, 0], [0.04, 0, 0], [0, 0, 0],
  ]);
  addRotation("Hips", [
    [0, 0, 0], [0, -0.08, 0], [0, 0.14, 0],
    [0, 0.1, 0], [0, 0.03, 0], [0, 0, 0],
  ]);
  addRotation("Spine", [
    [0, 0, 0], [0.02, 0.04, 0], [0.04, -0.08, 0],
    [0.02, -0.06, 0], [0, -0.02, 0], [0, 0, 0],
  ]);
  addRotation("LeftArm", [
    [0, 0, 0], [0.05, 0, -0.16], [0.12, 0, -0.42],
    [0.08, 0, -0.5], [0.02, 0, -0.18], [0, 0, 0],
  ]);
  addRotation("RightArm", [
    [0, 0, 0], [-0.05, 0, 0.16], [-0.12, 0, 0.42],
    [-0.08, 0, 0.5], [-0.02, 0, 0.18], [0, 0, 0],
  ]);

  if (!bones.has("RightUpLeg") || !bones.has("RightLeg") || !bones.has("RightFoot") || tracks.length < 3) {
    return null;
  }
  return new THREE.AnimationClip("Football Kick", 0.68, tracks);
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
