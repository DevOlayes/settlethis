import * as THREE from "three";
import type { PlayerCharacter } from "./PlayerCharacter";

export type PlayerAnimationInput = {
  speedRatio: number;
  jumping: boolean;
  sliding: boolean;
  laneLean: number;
};

export class PlayerAnimator {
  private runClock = 0;
  private kickElapsed = 10;
  private landingPulse = 0;
  private previousJumping = false;

  constructor(private readonly character: PlayerCharacter) {}

  reset(): void {
    this.runClock = 0;
    this.kickElapsed = 10;
    this.landingPulse = 0;
    this.previousJumping = false;
    this.character.root.rotation.set(0, 0, 0);
    this.character.torso.rotation.set(0, 0, 0);
    this.character.pelvis.rotation.set(0, 0, 0);
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
  }

  update(delta: number, input: PlayerAnimationInput): void {
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

    // Alternating leg drive with knee lift and trailing-foot recovery.
    c.leftThigh.rotation.x = gait * 0.58 * (1 - jumpWeight * 0.5) + jumpWeight * -0.28;
    c.rightThigh.rotation.x = opposite * 0.58 * (1 - jumpWeight * 0.5) + jumpWeight * -0.28;
    c.leftKnee.rotation.x = Math.max(0, -gait) * 0.82 + jumpWeight * 0.72 + slideWeight * 1.18;
    c.rightKnee.rotation.x = Math.max(0, -opposite) * 0.82 + jumpWeight * 0.72 + slideWeight * 1.18;
    c.leftThigh.rotation.x = THREE.MathUtils.lerp(c.leftThigh.rotation.x, -0.82, slideWeight * 0.9);
    c.rightThigh.rotation.x = THREE.MathUtils.lerp(c.rightThigh.rotation.x, -0.82, slideWeight * 0.9);
    c.leftFoot.rotation.x = -Math.max(0, gait) * 0.2;
    c.rightFoot.rotation.x = -Math.max(0, opposite) * 0.2;

    // Arms counter-swing against the legs, with elbows slightly flexed.
    c.leftArm.rotation.x = -gait * 0.42 - jumpWeight * 0.28 + slideWeight * 0.42;
    c.rightArm.rotation.x = -opposite * 0.42 - jumpWeight * 0.28 + slideWeight * 0.42;
    c.leftArm.rotation.z = -0.08 - slideWeight * 0.15;
    c.rightArm.rotation.z = 0.08 + slideWeight * 0.15;
    c.leftForearm.rotation.x = -0.32 - Math.max(0, gait) * 0.2 - slideWeight * 0.28;
    c.rightForearm.rotation.x = -0.32 - Math.max(0, opposite) * 0.2 - slideWeight * 0.28;

    // The body leans into lane changes and lowers into a compact slide pose.
    c.root.rotation.z = THREE.MathUtils.damp(c.root.rotation.z, -input.laneLean * 0.13, 8, delta);
    c.torso.rotation.x = THREE.MathUtils.damp(c.torso.rotation.x, slideWeight * 0.72 - jumpWeight * 0.12, 10, delta);
    c.pelvis.rotation.x = THREE.MathUtils.damp(c.pelvis.rotation.x, slideWeight * -0.3, 10, delta);
    const runningBounce = Math.abs(Math.sin(this.runClock * 2)) * 0.035;
    c.torso.position.y = 1.52 + runningBounce - slideWeight * 0.22 + jumpWeight * 0.05;
    c.pelvis.rotation.z = THREE.MathUtils.damp(c.pelvis.rotation.z, input.laneLean * 0.055, 9, delta);
    c.head.rotation.z = THREE.MathUtils.damp(c.head.rotation.z, -input.laneLean * 0.035, 8, delta);
    c.head.rotation.x = slideWeight * -0.12;
    c.torso.scale.y = 1 - this.landingPulse * 0.07;
    c.torso.scale.x = 1 + this.landingPulse * 0.025;

    // Automatic right-foot strike when a football is collected.
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
