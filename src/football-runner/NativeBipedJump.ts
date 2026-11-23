import * as THREE from "three";
import {
  createNativeBipedPoseClip,
  getNativeBipedJointProfile,
  type NativeBipedJointProfile,
} from "./NativeBipedPoseTools";

export const NATIVE_BIPED_JUMP_PHASES = {
  takeoff: 0.22,
  airborne: 0.48,
  landing: 0.32,
  total: 1.02,
} as const;

function collectBones(model: THREE.Object3D): Map<string, THREE.Bone> {
  const bones = new Map<string, THREE.Bone>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Bone) || !object.name.trim()) return;
    bones.set(object.name.trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase(), object);
  });
  return bones;
}

/**
 * The exact native run supplies the source bone tracks and reference pose.
 * Flexion axes come from the original Sports Male 03 parent/child geometry,
 * not from the gait's dominant swing axes. Additive deltas preserve the run.
 */
export function createNativeBipedJumpClips(
  model: THREE.Object3D,
  referenceRunClip: THREE.AnimationClip,
): THREE.AnimationClip[] {
  const bones = collectBones(model);
  const find = (name: string) => bones.get(name.toLowerCase());
  const profile = (name: string): NativeBipedJointProfile | undefined =>
    getNativeBipedJointProfile(referenceRunClip, find(name), model);

  const pelvis = profile("bip01 pelvis");
  const spine = profile("bip01 spine");
  const spine1 = profile("bip01 spine1");
  const chest = profile("bip01 spine2");
  const neck = profile("bip01 neck");
  const leftThigh = profile("bip01 l thigh");
  const rightThigh = profile("bip01 r thigh");
  const leftCalf = profile("bip01 l calf");
  const rightCalf = profile("bip01 r calf");
  const leftFoot = profile("bip01 l foot");
  const rightFoot = profile("bip01 r foot");
  const leftArm = profile("bip01 l upperarm");
  const rightArm = profile("bip01 r upperarm");
  const leftForearm = profile("bip01 l forearm");
  const rightForearm = profile("bip01 r forearm");

  const required = [
    ["left thigh", leftThigh], ["right thigh", rightThigh],
    ["left calf", leftCalf], ["right calf", rightCalf],
    ["left upper arm", leftArm], ["right upper arm", rightArm],
  ] as const;
  const missing = required.filter(([, joint]) => !joint).map(([name]) => name);
  if (missing.length) {
    throw new Error("Native Biped jump could not derive run-calibrated joints: " + missing.join(", "));
  }

  const make = (
    name: string,
    duration: number,
    times: number[],
    entries: Array<{ profile?: NativeBipedJointProfile; angles: number[] }>,
  ) => createNativeBipedPoseClip(name, duration, referenceRunClip, times, entries, true);

  const takeoff = make(
    "sports-male-03-jump-takeoff-native",
    NATIVE_BIPED_JUMP_PHASES.takeoff,
    [0, 0.07, 0.15, 0.22],
    [
      { profile: pelvis, angles: [0, 0.02, 0.04, 0.04] },
      { profile: spine, angles: [0, 0.12, 0.26, 0.30] },
      { profile: spine1, angles: [0, 0.06, 0.13, 0.16] },
      { profile: chest, angles: [0, 0.05, 0.10, 0.12] },
      { profile: neck, angles: [0, -0.06, -0.12, -0.14] },
      { profile: leftThigh, angles: [0, 0.34, 0.70, 0.92] },
      { profile: rightThigh, angles: [0, -0.12, -0.28, -0.38] },
      { profile: leftCalf, angles: [0, 0.35, 0.72, 0.92] },
      { profile: rightCalf, angles: [0, 0.02, 0.06, 0.10] },
      { profile: leftFoot, angles: [0, 0.02, 0.04, 0.06] },
      { profile: rightFoot, angles: [0, 0.02, 0.02, 0.02] },
      { profile: leftArm, angles: [0, 0.16, 0.34, 0.42] },
      { profile: rightArm, angles: [0, 0.16, 0.34, 0.42] },
      { profile: leftForearm, angles: [0, 0.12, 0.26, 0.34] },
      { profile: rightForearm, angles: [0, 0.12, 0.26, 0.34] },
    ],
  );

  const air = make(
    "sports-male-03-jump-air-native",
    NATIVE_BIPED_JUMP_PHASES.airborne,
    [0, 0.12, 0.24, 0.36, 0.48],
    [
      { profile: pelvis, angles: [0.04, 0.04, 0.03, 0.03, 0.02] },
      { profile: spine, angles: [0.28, 0.30, 0.28, 0.25, 0.22] },
      { profile: spine1, angles: [0.15, 0.16, 0.15, 0.13, 0.11] },
      { profile: chest, angles: [0.10, 0.11, 0.10, 0.09, 0.08] },
      { profile: neck, angles: [-0.14, -0.16, -0.14, -0.12, -0.10] },
      { profile: leftThigh, angles: [0.88, 0.96, 0.94, 0.88, 0.80] },
      { profile: rightThigh, angles: [0.72, 0.82, 0.80, 0.74, 0.66] },
      { profile: leftCalf, angles: [1.02, 1.12, 1.10, 1.04, 0.96] },
      { profile: rightCalf, angles: [0.92, 1.02, 1.00, 0.94, 0.86] },
      { profile: leftFoot, angles: [0.02, 0.04, 0.04, 0.02, 0] },
      { profile: rightFoot, angles: [0.02, 0.04, 0.04, 0.02, 0] },
      { profile: leftArm, angles: [0.42, 0.46, 0.44, 0.40, 0.34] },
      { profile: rightArm, angles: [0.42, 0.46, 0.44, 0.40, 0.34] },
      { profile: leftForearm, angles: [0.34, 0.38, 0.36, 0.32, 0.28] },
      { profile: rightForearm, angles: [0.34, 0.38, 0.36, 0.32, 0.28] },
    ],
  );

  const landing = make(
    "sports-male-03-jump-land-native",
    NATIVE_BIPED_JUMP_PHASES.landing,
    [0, 0.08, 0.20, 0.32],
    [
      { profile: pelvis, angles: [0.03, 0.05, 0.02, 0] },
      { profile: spine, angles: [0.24, 0.28, 0.14, 0] },
      { profile: spine1, angles: [0.12, 0.14, 0.07, 0] },
      { profile: chest, angles: [0.08, 0.10, 0.05, 0] },
      { profile: neck, angles: [-0.10, -0.12, -0.04, 0] },
      { profile: leftThigh, angles: [0.58, 0.38, 0.16, 0] },
      { profile: rightThigh, angles: [0.58, 0.38, 0.16, 0] },
      { profile: leftCalf, angles: [0.78, 0.62, 0.28, 0] },
      { profile: rightCalf, angles: [0.78, 0.62, 0.28, 0] },
      { profile: leftFoot, angles: [0.04, 0.02, 0.01, 0] },
      { profile: rightFoot, angles: [0.04, 0.02, 0.01, 0] },
      { profile: leftArm, angles: [0.34, 0.26, 0.12, 0] },
      { profile: rightArm, angles: [0.34, 0.26, 0.12, 0] },
      { profile: leftForearm, angles: [0.28, 0.22, 0.10, 0] },
      { profile: rightForearm, angles: [0.28, 0.22, 0.10, 0] },
    ],
  );

  return [takeoff, air, landing];
}
