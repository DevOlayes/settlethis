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
 * Jump poses are local-axis deltas measured from every keyframe of the
 * approved native run. They are converted to additive clips against frame 0
 * of that same run, preserving the live running gait beneath the jump.
 */
export function createNativeBipedJumpClips(
  model: THREE.Object3D,
  referenceRunClip: THREE.AnimationClip,
): THREE.AnimationClip[] {
  const bones = collectBones(model);
  const find = (name: string) => bones.get(name.toLowerCase());
  const profile = (name: string): NativeBipedJointProfile | undefined =>
    getNativeBipedJointProfile(model, referenceRunClip, find(name));

  const pelvis = profile("bip01 pelvis");
  const spine = profile("bip01 spine");
  const chest = profile("bip01 spine2");
  const head = profile("bip01 head");
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
      { profile: pelvis, angles: [0, 0.03, 0.04, 0.03] },
      { profile: spine, angles: [0, 0.12, 0.25, 0.22] },
      { profile: chest, angles: [0, 0.08, 0.16, 0.15] },
      { profile: head, angles: [0, -0.03, -0.07, -0.06] },
      { profile: leftThigh, angles: [0, 0.30, 0.65, 0.82] },
      { profile: rightThigh, angles: [0, 0.24, 0.55, 0.72] },
      { profile: leftCalf, angles: [0, 0.35, 0.70, 0.85] },
      { profile: rightCalf, angles: [0, 0.30, 0.62, 0.78] },
      { profile: leftFoot, angles: [0, -0.05, -0.12, -0.12] },
      { profile: rightFoot, angles: [0, -0.04, -0.10, -0.10] },
      { profile: leftArm, angles: [0, 0.20, 0.42, 0.48] },
      { profile: rightArm, angles: [0, 0.20, 0.42, 0.48] },
      { profile: leftForearm, angles: [0, 0.15, 0.35, 0.42] },
      { profile: rightForearm, angles: [0, 0.15, 0.35, 0.42] },
    ],
  );

  const air = make(
    "sports-male-03-jump-air-native",
    NATIVE_BIPED_JUMP_PHASES.airborne,
    [0, 0.12, 0.24, 0.36, 0.48],
    [
      { profile: pelvis, angles: [0.04, 0.04, 0.03, 0.03, 0.02] },
      { profile: spine, angles: [0.22, 0.24, 0.22, 0.20, 0.18] },
      { profile: chest, angles: [0.16, 0.18, 0.16, 0.15, 0.14] },
      { profile: head, angles: [-0.06, -0.08, -0.06, -0.05, -0.04] },
      { profile: leftThigh, angles: [0.92, 1.02, 1.00, 0.96, 0.90] },
      { profile: rightThigh, angles: [0.82, 0.92, 0.90, 0.86, 0.80] },
      { profile: leftCalf, angles: [1.05, 1.18, 1.14, 1.10, 1.02] },
      { profile: rightCalf, angles: [0.96, 1.10, 1.06, 1.02, 0.94] },
      { profile: leftFoot, angles: [-0.12, -0.18, -0.16, -0.14, -0.10] },
      { profile: rightFoot, angles: [-0.10, -0.16, -0.14, -0.12, -0.08] },
      { profile: leftArm, angles: [0.55, 0.58, 0.56, 0.54, 0.50] },
      { profile: rightArm, angles: [0.58, 0.60, 0.58, 0.56, 0.52] },
      { profile: leftForearm, angles: [0.45, 0.48, 0.46, 0.44, 0.40] },
      { profile: rightForearm, angles: [0.45, 0.48, 0.46, 0.44, 0.40] },
    ],
  );

  const landing = make(
    "sports-male-03-jump-land-native",
    NATIVE_BIPED_JUMP_PHASES.landing,
    [0, 0.08, 0.20, 0.32],
    [
      { profile: pelvis, angles: [0.03, 0.05, 0.02, 0] },
      { profile: spine, angles: [0.18, 0.26, 0.16, 0] },
      { profile: chest, angles: [0.12, 0.20, 0.10, 0] },
      { profile: head, angles: [-0.04, -0.08, -0.02, 0] },
      { profile: leftThigh, angles: [0.72, 0.42, 0.15, 0] },
      { profile: rightThigh, angles: [0.66, 0.38, 0.13, 0] },
      { profile: leftCalf, angles: [0.42, 0.18, 0.85, 0] },
      { profile: rightCalf, angles: [0.38, 0.16, 0.78, 0] },
      { profile: leftFoot, angles: [0.06, 0.02, -0.08, 0] },
      { profile: rightFoot, angles: [0.06, 0.02, -0.08, 0] },
      { profile: leftArm, angles: [0.40, 0.28, 0.16, 0] },
      { profile: rightArm, angles: [0.40, 0.28, 0.16, 0] },
      { profile: leftForearm, angles: [0.35, 0.25, 0.12, 0] },
      { profile: rightForearm, angles: [0.35, 0.25, 0.12, 0] },
    ],
  );

  return [takeoff, air, landing];
}
