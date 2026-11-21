import * as THREE from "three";

type Pose = readonly [number, number, number];

export const NATIVE_BIPED_MANEUVER_PHASES = {
  slideStart: 0.24,
  slideLoop: 0.62,
  slideRecovery: 0.34,
  laneChange: 0.52,
} as const;

function key(name: string): string {
  return name.trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function bonesByName(model: THREE.Object3D): Map<string, THREE.Bone> {
  const result = new Map<string, THREE.Bone>();
  model.traverse((object) => {
    if (object instanceof THREE.Bone && object.name.trim()) result.set(key(object.name), object);
  });
  return result;
}

/**
 * Native Sports Male 03 Biped manoeuvres.
 * Flexion is authored around the limb hinge axes (not the long-axis twist that
 * caused the first prototype's arms to flare). Root travel/vertical drop is
 * previewed by the diagnostic and is deliberately not baked into these clips.
 */
export function createNativeBipedManeuverClips(
  model: THREE.Object3D,
  referenceRunClip: THREE.AnimationClip,
): THREE.AnimationClip[] {
  const bones = bonesByName(model);
  const driven = new Set(referenceRunClip.tracks
    .filter((track) => track.name.endsWith(".quaternion"))
    .map((track) => key(track.name.slice(0, -".quaternion".length))));
  const find = (name: string) => {
    const normalized = key(name);
    return driven.has(normalized) ? bones.get(normalized) : undefined;
  };

  const pelvis = find("Bip01 Pelvis");
  const spine = find("Bip01 Spine");
  const chest = find("Bip01 Spine2") ?? find("Bip01 Spine1");
  const head = find("Bip01 Head");
  const lThigh = find("Bip01 L Thigh");
  const rThigh = find("Bip01 R Thigh");
  const lCalf = find("Bip01 L Calf");
  const rCalf = find("Bip01 R Calf");
  const lFoot = find("Bip01 L Foot");
  const rFoot = find("Bip01 R Foot");
  const lArm = find("Bip01 L UpperArm");
  const rArm = find("Bip01 R UpperArm");
  const lForearm = find("Bip01 L Forearm");
  const rForearm = find("Bip01 R Forearm");

  const required = [
    ["pelvis", pelvis], ["spine", spine], ["left thigh", lThigh], ["right thigh", rThigh],
    ["left calf", lCalf], ["right calf", rCalf], ["left upper arm", lArm], ["right upper arm", rArm],
  ] as const;
  const missing = required.filter(([, bone]) => !bone).map(([name]) => name);
  if (missing.length) throw new Error("Native Biped manoeuvres missing run-driven bones: " + missing.join(", "));

  const makeTracks = (times: number[], entries: Array<{ bone?: THREE.Bone; poses: Pose[] }>) => {
    const tracks: THREE.KeyframeTrack[] = [];
    for (const { bone, poses } of entries) {
      if (!bone || poses.length !== times.length) continue;
      const base = bone.quaternion.clone();
      const values: number[] = [];
      for (const [x, y, z] of poses) {
        const offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
        const q = base.clone().multiply(offset).normalize();
        values.push(q.x, q.y, q.z, q.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values));
    }
    return tracks;
  };

  // Compact two-footed tuck: hips and torso fold, knees close sharply,
  // feet tuck under, and arms stay close rather than flaring out.
  const slideStart = new THREE.AnimationClip("sports-male-03-slide-start-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideStart,
    makeTracks([0, 0.12, 0.24], [
      { bone: pelvis, poses: [[0,0,0], [0,0,0.16], [0,0,0.24]] },
      { bone: spine, poses: [[0,0,0], [0,0,0.52], [0,0,0.70]] },
      { bone: chest, poses: [[0,0,0], [0,0,0.24], [0,0,0.34]] },
      { bone: head, poses: [[0,0,0], [0,0,-0.12], [0,0,-0.18]] },
      { bone: lThigh, poses: [[0,0,0], [0,0,0.54], [0,0,0.78]] },
      { bone: rThigh, poses: [[0,0,0], [0,0,0.54], [0,0,0.78]] },
      { bone: lCalf, poses: [[0,0,0], [0,0,-0.98], [0,0,-1.42]] },
      { bone: rCalf, poses: [[0,0,0], [0,0,-0.98], [0,0,-1.42]] },
      { bone: lFoot, poses: [[0,0,0], [0,0,0.24], [0,0,0.38]] },
      { bone: rFoot, poses: [[0,0,0], [0,0,0.24], [0,0,0.38]] },
      { bone: lArm, poses: [[0,0,0], [0,0,-0.12], [0,0,-0.18]] },
      { bone: rArm, poses: [[0,0,0], [0,0,0.12], [0,0,0.18]] },
      { bone: lForearm, poses: [[0,0,0], [0,0,0.38], [0,0,0.52]] },
      { bone: rForearm, poses: [[0,0,0], [0,0,-0.38], [0,0,-0.52]] },
    ]));

  const slideLoop = new THREE.AnimationClip("sports-male-03-slide-loop-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideLoop,
    makeTracks([0, 0.31, 0.62], [
      { bone: pelvis, poses: [[0,0,0.24], [0,0,0.26], [0,0,0.24]] },
      { bone: spine, poses: [[0,0,0.70], [0,0,0.74], [0,0,0.70]] },
      { bone: chest, poses: [[0,0,0.34], [0,0,0.36], [0,0,0.34]] },
      { bone: head, poses: [[0,0,-0.18], [0,0,-0.16], [0,0,-0.18]] },
      { bone: lThigh, poses: [[0,0,0.78], [0,0,0.82], [0,0,0.78]] },
      { bone: rThigh, poses: [[0,0,0.78], [0,0,0.82], [0,0,0.78]] },
      { bone: lCalf, poses: [[0,0,-1.42], [0,0,-1.48], [0,0,-1.42]] },
      { bone: rCalf, poses: [[0,0,-1.42], [0,0,-1.48], [0,0,-1.42]] },
      { bone: lFoot, poses: [[0,0,0.38], [0,0,0.34], [0,0,0.38]] },
      { bone: rFoot, poses: [[0,0,0.38], [0,0,0.34], [0,0,0.38]] },
      { bone: lArm, poses: [[0,0,-0.18], [0,0,-0.16], [0,0,-0.18]] },
      { bone: rArm, poses: [[0,0,0.18], [0,0,0.16], [0,0,0.18]] },
      { bone: lForearm, poses: [[0,0,0.52], [0,0,0.48], [0,0,0.52]] },
      { bone: rForearm, poses: [[0,0,-0.52], [0,0,-0.48], [0,0,-0.52]] },
    ]));

  const slideRecovery = new THREE.AnimationClip("sports-male-03-slide-recovery-native",
    NATIVE_BIPED_MANEUVER_PHASES.slideRecovery,
    makeTracks([0, 0.11, 0.23, 0.34], [
      { bone: pelvis, poses: [[0,0,0.24], [0,0,0.18], [0,0,0.06], [0,0,0]] },
      { bone: spine, poses: [[0,0,0.70], [0,0,0.48], [0,0,0.20], [0,0,0]] },
      { bone: chest, poses: [[0,0,0.34], [0,0,0.22], [0,0,0.08], [0,0,0]] },
      { bone: head, poses: [[0,0,-0.18], [0,0,-0.12], [0,0,-0.04], [0,0,0]] },
      { bone: lThigh, poses: [[0,0,0.78], [0,0,0.54], [0,0,0.20], [0,0,0]] },
      { bone: rThigh, poses: [[0,0,0.78], [0,0,0.54], [0,0,0.20], [0,0,0]] },
      { bone: lCalf, poses: [[0,0,-1.42], [0,0,-0.98], [0,0,-0.34], [0,0,0]] },
      { bone: rCalf, poses: [[0,0,-1.42], [0,0,-0.98], [0,0,-0.34], [0,0,0]] },
      { bone: lFoot, poses: [[0,0,0.38], [0,0,0.26], [0,0,0.08], [0,0,0]] },
      { bone: rFoot, poses: [[0,0,0.38], [0,0,0.26], [0,0,0.08], [0,0,0]] },
      { bone: lArm, poses: [[0,0,-0.18], [0,0,-0.12], [0,0,-0.04], [0,0,0]] },
      { bone: rArm, poses: [[0,0,0.18], [0,0,0.12], [0,0,0.04], [0,0,0]] },
      { bone: lForearm, poses: [[0,0,0.52], [0,0,0.36], [0,0,0.12], [0,0,0]] },
      { bone: rForearm, poses: [[0,0,-0.52], [0,0,-0.36], [0,0,-0.12], [0,0,0]] },
    ]));

  // Stronger readable bank and counterbalance; lane translation is previewed
  // separately so the complete action reads as a real change of direction.
  const laneClip = (direction: "left" | "right") => {
    const sign = direction === "left" ? 1 : -1;
    const times = [0, 0.16, 0.34, 0.52];
    return new THREE.AnimationClip(`sports-male-03-lane-${direction}-native`,
      NATIVE_BIPED_MANEUVER_PHASES.laneChange,
      makeTracks(times, [
        { bone: pelvis, poses: [[0,0,0], [0,sign * 0.08,sign * -0.18], [0,sign * 0.04,sign * -0.12], [0,0,0]] },
        { bone: spine, poses: [[0,0,0], [0,sign * -0.10,sign * 0.34], [0,sign * -0.06,sign * 0.24], [0,0,0]] },
        { bone: chest, poses: [[0,0,0], [0,sign * -0.06,sign * 0.22], [0,sign * -0.04,sign * 0.16], [0,0,0]] },
        { bone: head, poses: [[0,0,0], [0,sign * 0.04,sign * -0.10], [0,sign * 0.02,sign * -0.06], [0,0,0]] },
        { bone: lThigh, poses: [[0,0,0], [0,0,sign * -0.18], [0,0,sign * 0.10], [0,0,0]] },
        { bone: rThigh, poses: [[0,0,0], [0,0,sign * 0.18], [0,0,sign * -0.10], [0,0,0]] },
        { bone: lArm, poses: [[0,0,0], [0,sign * 0.10,sign * -0.24], [0,sign * 0.06,sign * -0.14], [0,0,0]] },
        { bone: rArm, poses: [[0,0,0], [0,sign * -0.10,sign * 0.24], [0,sign * -0.06,sign * 0.14], [0,0,0]] },
        { bone: lForearm, poses: [[0,0,0], [0,0,sign * 0.16], [0,0,sign * 0.08], [0,0,0]] },
        { bone: rForearm, poses: [[0,0,0], [0,0,sign * -0.16], [0,0,sign * -0.08], [0,0,0]] },
      ]));
  };

  const clips = [slideStart, slideLoop, slideRecovery, laneClip("left"), laneClip("right")];
  clips.forEach((clip) => clip.optimize());
  return clips;
}
