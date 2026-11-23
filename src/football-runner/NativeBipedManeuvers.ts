import * as THREE from "three";
import {
  createNativeBipedPoseClip,
  getNativeBipedJointProfile,
  type NativeBipedJointProfile,
} from "./NativeBipedPoseTools";

type LanePose = readonly [number, number, number];

export const NATIVE_BIPED_MANEUVER_PHASES = {
  slideStart: 0.22,
  slideLoop: 0.58,
  slideRecovery: 0.38,
  laneChange: 0.52,
} as const;

function normalizedName(value: string): string {
  return value.trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function bonesByName(model: THREE.Object3D): Map<string, THREE.Bone> {
  const result = new Map<string, THREE.Bone>();
  model.traverse((object) => {
    if (object instanceof THREE.Bone && object.name.trim()) {
      result.set(normalizedName(object.name), object);
    }
  });
  return result;
}

/**
 * The slide is authored from the exact native run reference pose and the
 * measured local swing axes. The left leg leads, the right knee folds under,
 * and the left arm is reserved as the ground-bracing support.
 */
export function createNativeBipedManeuverClips(
  model: THREE.Object3D,
  referenceRunClip: THREE.AnimationClip,
): THREE.AnimationClip[] {
  const bones = bonesByName(model);
  const profile = (name: string): NativeBipedJointProfile | undefined =>
    getNativeBipedJointProfile(model, referenceRunClip, bones.get(normalizedName(name)));

  const pelvis = profile("Bip01 Pelvis");
  const spine = profile("Bip01 Spine");
  const chest = profile("Bip01 Spine2");
  const head = profile("Bip01 Head");
  const lThigh = profile("Bip01 L Thigh");
  const rThigh = profile("Bip01 R Thigh");
  const lCalf = profile("Bip01 L Calf");
  const rCalf = profile("Bip01 R Calf");
  const lFoot = profile("Bip01 L Foot");
  const rFoot = profile("Bip01 R Foot");
  const lArm = profile("Bip01 L UpperArm");
  const rArm = profile("Bip01 R UpperArm");
  const lForearm = profile("Bip01 L Forearm");
  const rForearm = profile("Bip01 R Forearm");

  const required = [
    ["spine", spine], ["left thigh", lThigh], ["right thigh", rThigh],
    ["left calf", lCalf], ["right calf", rCalf],
    ["left upper arm", lArm], ["right upper arm", rArm],
    ["left forearm", lForearm], ["right forearm", rForearm],
  ] as const;
  const missing = required.filter(([, joint]) => !joint).map(([name]) => name);
  if (missing.length) {
    throw new Error("Native Biped slide could not derive run-calibrated joints: " + missing.join(", "));
  }

  const slideStart = createNativeBipedPoseClip(
    "sports-male-03-slide-start-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideStart,
    referenceRunClip,
    [0, 0.11, 0.22],
    [
      { profile: pelvis, angles: [0, 0.02, 0.03] },
      { profile: spine, angles: [0, 0.22, 0.46] },
      { profile: chest, angles: [0, 0.16, 0.34] },
      { profile: head, angles: [0, -0.06, -0.12] },
      { profile: lThigh, angles: [0, 0.48, 0.95] },
      { profile: rThigh, angles: [0, -0.20, -0.42] },
      { profile: lCalf, angles: [0, 0.04, 0.10] },
      { profile: rCalf, angles: [0, 0.65, 1.22] },
      { profile: lFoot, angles: [0, 0.04, 0.08] },
      { profile: rFoot, angles: [0, -0.06, -0.12] },
      { profile: lArm, angles: [0, 0.18, 0.42] },
      { profile: rArm, angles: [0, -0.10, -0.20] },
      { profile: lForearm, angles: [0, 0.42, 0.82] },
      { profile: rForearm, angles: [0, -0.10, -0.18] },
    ],
    false,
  );

  const slideLoop = createNativeBipedPoseClip(
    "sports-male-03-slide-loop-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideLoop,
    referenceRunClip,
    [0, 0.29, 0.58],
    [
      { profile: pelvis, angles: [0.03, 0.03, 0.03] },
      { profile: spine, angles: [0.46, 0.48, 0.46] },
      { profile: chest, angles: [0.34, 0.36, 0.34] },
      { profile: head, angles: [-0.12, -0.10, -0.12] },
      { profile: lThigh, angles: [0.95, 0.98, 0.95] },
      { profile: rThigh, angles: [-0.42, -0.45, -0.42] },
      { profile: lCalf, angles: [0.10, 0.12, 0.10] },
      { profile: rCalf, angles: [1.22, 1.26, 1.22] },
      { profile: lFoot, angles: [0.08, 0.06, 0.08] },
      { profile: rFoot, angles: [-0.12, -0.10, -0.12] },
      { profile: lArm, angles: [0.42, 0.44, 0.42] },
      { profile: rArm, angles: [-0.20, -0.18, -0.20] },
      { profile: lForearm, angles: [0.82, 0.85, 0.82] },
      { profile: rForearm, angles: [-0.18, -0.16, -0.18] },
    ],
    false,
  );

  const slideRecovery = createNativeBipedPoseClip(
    "sports-male-03-slide-recovery-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideRecovery,
    referenceRunClip,
    [0, 0.11, 0.23, 0.38],
    [
      { profile: pelvis, angles: [0.03, 0.02, 0.01, 0] },
      { profile: spine, angles: [0.46, 0.30, 0.12, 0] },
      { profile: chest, angles: [0.34, 0.22, 0.08, 0] },
      { profile: head, angles: [-0.12, -0.08, -0.03, 0] },
      { profile: lThigh, angles: [0.95, 0.62, 0.24, 0] },
      { profile: rThigh, angles: [-0.42, -0.28, -0.10, 0] },
      { profile: lCalf, angles: [0.10, 0.08, 0.03, 0] },
      { profile: rCalf, angles: [1.22, 0.84, 0.32, 0] },
      { profile: lFoot, angles: [0.08, 0.05, 0.02, 0] },
      { profile: rFoot, angles: [-0.12, -0.08, -0.03, 0] },
      { profile: lArm, angles: [0.42, 0.28, 0.10, 0] },
      { profile: rArm, angles: [-0.20, -0.12, -0.04, 0] },
      { profile: lForearm, angles: [0.82, 0.54, 0.18, 0] },
      { profile: rForearm, angles: [-0.18, -0.12, -0.04, 0] },
    ],
    false,
  );

  // Keep the existing lane-change behavior outside this jump/slide rebuild.
  const laneClip = (direction: "left" | "right") => {
    const sign = direction === "left" ? 1 : -1;
    const times = [0, 0.16, 0.34, 0.52];
    const entries: Array<{ bone?: THREE.Bone; poses: LanePose[] }> = [
      { bone: bones.get(normalizedName("Bip01 Pelvis")), poses: [[0,0,0], [0,sign * 0.08,sign * -0.18], [0,sign * 0.04,sign * -0.12], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 Spine")), poses: [[0,0,0], [0,sign * -0.10,sign * 0.34], [0,sign * -0.06,sign * 0.24], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 Spine2")), poses: [[0,0,0], [0,sign * -0.06,sign * 0.22], [0,sign * -0.04,sign * 0.16], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 Head")), poses: [[0,0,0], [0,sign * 0.04,sign * -0.10], [0,sign * 0.02,sign * -0.06], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 L Thigh")), poses: [[0,0,0], [0,0,sign * -0.18], [0,0,sign * 0.10], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 R Thigh")), poses: [[0,0,0], [0,0,sign * 0.18], [0,0,sign * -0.10], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 L UpperArm")), poses: [[0,0,0], [0,sign * 0.10,sign * -0.24], [0,sign * 0.06,sign * -0.14], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 R UpperArm")), poses: [[0,0,0], [0,sign * -0.10,sign * 0.24], [0,sign * -0.06,sign * 0.14], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 L Forearm")), poses: [[0,0,0], [0,0,sign * 0.16], [0,0,sign * 0.08], [0,0,0]] },
      { bone: bones.get(normalizedName("Bip01 R Forearm")), poses: [[0,0,0], [0,0,sign * -0.16], [0,0,sign * -0.08], [0,0,0]] },
    ];
    const tracks: THREE.KeyframeTrack[] = [];
    for (const { bone, poses } of entries) {
      if (!bone) continue;
      const values: number[] = [];
      for (const [x, y, z] of poses) {
        const offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
        const pose = bone.quaternion.clone().multiply(offset).normalize();
        values.push(pose.x, pose.y, pose.z, pose.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values));
    }
    const clip = new THREE.AnimationClip(`sports-male-03-lane-${direction}-native`, NATIVE_BIPED_MANEUVER_PHASES.laneChange, tracks);
    clip.optimize();
    return clip;
  };

  return [slideStart, slideLoop, slideRecovery, laneClip("left"), laneClip("right")];
}
