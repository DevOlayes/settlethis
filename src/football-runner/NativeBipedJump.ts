import * as THREE from "three";

type EulerPose = readonly [number, number, number];

function normalizeBoneName(value: string): string {
  return value.trim().replace(/_/g, " ").replace(/\\s+/g, " ").toLowerCase();
}

function collectBones(model: THREE.Object3D): Map<string, THREE.Bone> {
  const bones = new Map<string, THREE.Bone>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Bone) || !object.name.trim()) return;
    // The native GLB stores track targets with underscores while the avatar
    // exposes the same Bip01 names with spaces. Match their normalized names,
    // but always bind the generated track to the avatar's exact bone name.
    bones.set(normalizeBoneName(object.name), object);
  });
  return bones;
}

/**
 * Creates small, in-place jump clips directly against Sports Male 03's
 * existing Biped bind pose. No bone is renamed, reparented or translated.
 * The game root owns vertical travel; these clips only animate the body.
 */
export function createNativeBipedJumpClips(
  model: THREE.Object3D,
  referenceRunClip: THREE.AnimationClip,
): THREE.AnimationClip[] {
  const bones = collectBones(model);
  // The approved native run is the source of truth: only animate bones that
  // its 52 direct quaternion tracks actually drive on this same character.
  const runTrackNames = new Set(referenceRunClip.tracks
    .filter((track) => track.name.endsWith(".quaternion"))
    .map((track) => normalizeBoneName(track.name.slice(0, -".quaternion".length))));
  const find = (...names: string[]): THREE.Bone | undefined => {
    for (const name of names) {
      const key = normalizeBoneName(name);
      if (!runTrackNames.has(key)) continue;
      const bone = bones.get(key);
      if (bone) return bone;
    }
    return undefined;
  };

  const tracksFor = (
    times: number[],
    poses: Array<{ bone: THREE.Bone | undefined; values: EulerPose[] }>,
  ): THREE.KeyframeTrack[] => {
    const tracks: THREE.KeyframeTrack[] = [];
    for (const { bone, values } of poses) {
      if (!bone || values.length !== times.length) continue;
      const base = bone.quaternion.clone();
      const rotations: number[] = [];
      for (const [x, y, z] of values) {
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
        const pose = base.clone().multiply(delta).normalize();
        rotations.push(pose.x, pose.y, pose.z, pose.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, rotations));
    }
    return tracks;
  };

  const hips = find("Bip01 Pelvis");
  const spine = find("Bip01 Spine");
  const spine2 = find("Bip01 Spine2", "Bip01 Spine1");
  const leftThigh = find("Bip01 L Thigh");
  const rightThigh = find("Bip01 R Thigh");
  const leftCalf = find("Bip01 L Calf");
  const rightCalf = find("Bip01 R Calf");
  const leftFoot = find("Bip01 L Foot");
  const rightFoot = find("Bip01 R Foot");
  const leftArm = find("Bip01 L UpperArm");
  const rightArm = find("Bip01 R UpperArm");
  const leftForearm = find("Bip01 L Forearm");
  const rightForearm = find("Bip01 R Forearm");

  const required = [
    ["pelvis", hips], ["left thigh", leftThigh], ["right thigh", rightThigh],
    ["left calf", leftCalf], ["right calf", rightCalf],
    ["left upper arm", leftArm], ["right upper arm", rightArm],
  ] as const;
  const missing = required.filter(([, bone]) => !bone).map(([name]) => name);
  if (missing.length) {
    throw new Error("Sports Male 03 native Biped jump is missing required bones: " + missing.join(", "));
  }

  const takeoffTimes = [0, 0.08, 0.22];
  const takeoff = tracksFor(takeoffTimes, [
    { bone: hips, values: [[0, 0, 0], [0.15, 0, 0], [0.04, 0, 0]] },
    { bone: spine, values: [[0, 0, 0], [0.08, 0, 0], [-0.04, 0, 0]] },
    { bone: spine2, values: [[0, 0, 0], [0.04, 0, 0], [-0.03, 0, 0]] },
    { bone: leftThigh, values: [[0, 0, 0], [0.35, 0, 0], [-0.20, 0, 0]] },
    { bone: rightThigh, values: [[0, 0, 0], [0.35, 0, 0], [-0.20, 0, 0]] },
    { bone: leftCalf, values: [[0, 0, 0], [0.62, 0, 0], [0.05, 0, 0]] },
    { bone: rightCalf, values: [[0, 0, 0], [0.62, 0, 0], [0.05, 0, 0]] },
    { bone: leftArm, values: [[0, 0, 0], [0.16, 0, -0.08], [-0.48, 0, -0.12]] },
    { bone: rightArm, values: [[0, 0, 0], [0.16, 0, 0.08], [-0.48, 0, 0.12]] },
    { bone: leftForearm, values: [[0, 0, 0], [-0.12, 0, 0], [-0.42, 0, 0]] },
    { bone: rightForearm, values: [[0, 0, 0], [-0.12, 0, 0], [-0.42, 0, 0]] },
  ]);

  const airTimes = [0, 0.24, 0.48];
  const air = tracksFor(airTimes, [
    { bone: hips, values: [[0.13, 0, 0], [0.10, 0, 0], [0.13, 0, 0]] },
    { bone: spine, values: [[-0.12, 0, 0], [-0.08, 0, 0], [-0.12, 0, 0]] },
    { bone: spine2, values: [[-0.08, 0, 0], [-0.04, 0, 0], [-0.08, 0, 0]] },
    { bone: leftThigh, values: [[-0.52, 0, 0], [-0.46, 0, 0], [-0.52, 0, 0]] },
    { bone: rightThigh, values: [[-0.52, 0, 0], [-0.46, 0, 0], [-0.52, 0, 0]] },
    { bone: leftCalf, values: [[0.38, 0, 0], [0.52, 0, 0], [0.38, 0, 0]] },
    { bone: rightCalf, values: [[0.38, 0, 0], [0.52, 0, 0], [0.38, 0, 0]] },
    { bone: leftFoot, values: [[-0.10, 0, 0], [-0.16, 0, 0], [-0.10, 0, 0]] },
    { bone: rightFoot, values: [[-0.10, 0, 0], [-0.16, 0, 0], [-0.10, 0, 0]] },
    { bone: leftArm, values: [[-0.48, 0, -0.12], [-0.42, 0, -0.12], [-0.48, 0, -0.12]] },
    { bone: rightArm, values: [[-0.48, 0, 0.12], [-0.42, 0, 0.12], [-0.48, 0, 0.12]] },
    { bone: leftForearm, values: [[-0.42, 0, 0], [-0.52, 0, 0], [-0.42, 0, 0]] },
    { bone: rightForearm, values: [[-0.42, 0, 0], [-0.52, 0, 0], [-0.42, 0, 0]] },
  ]);

  const landingTimes = [0, 0.08, 0.20, 0.32];
  const landing = tracksFor(landingTimes, [
    { bone: hips, values: [[0.13, 0, 0], [0.16, 0, 0], [0.22, 0, 0], [0, 0, 0]] },
    { bone: spine, values: [[-0.12, 0, 0], [0.04, 0, 0], [0.12, 0, 0], [0, 0, 0]] },
    { bone: spine2, values: [[-0.08, 0, 0], [0.02, 0, 0], [0.06, 0, 0], [0, 0, 0]] },
    { bone: leftThigh, values: [[-0.52, 0, 0], [-0.22, 0, 0], [0.08, 0, 0], [0, 0, 0]] },
    { bone: rightThigh, values: [[-0.52, 0, 0], [-0.22, 0, 0], [0.08, 0, 0], [0, 0, 0]] },
    { bone: leftCalf, values: [[0.38, 0, 0], [0.22, 0, 0], [0.78, 0, 0], [0, 0, 0]] },
    { bone: rightCalf, values: [[0.38, 0, 0], [0.22, 0, 0], [0.78, 0, 0], [0, 0, 0]] },
    { bone: leftFoot, values: [[-0.10, 0, 0], [0.04, 0, 0], [0.12, 0, 0], [0, 0, 0]] },
    { bone: rightFoot, values: [[-0.10, 0, 0], [0.04, 0, 0], [0.12, 0, 0], [0, 0, 0]] },
    { bone: leftArm, values: [[-0.48, 0, -0.12], [-0.18, 0, -0.08], [0.18, 0, -0.04], [0, 0, 0]] },
    { bone: rightArm, values: [[-0.48, 0, 0.12], [-0.18, 0, 0.08], [0.18, 0, 0.04], [0, 0, 0]] },
    { bone: leftForearm, values: [[-0.42, 0, 0], [-0.24, 0, 0], [-0.30, 0, 0], [0, 0, 0]] },
    { bone: rightForearm, values: [[-0.42, 0, 0], [-0.24, 0, 0], [-0.30, 0, 0], [0, 0, 0]] },
  ]);

  const clips = [
    new THREE.AnimationClip("sports-male-03-jump-takeoff-native", 0.22, takeoff),
    new THREE.AnimationClip("sports-male-03-jump-air-native", 0.48, air),
    new THREE.AnimationClip("sports-male-03-jump-land-native", 0.32, landing),
  ];
  for (const clip of clips) clip.optimize();
  return clips;
}
