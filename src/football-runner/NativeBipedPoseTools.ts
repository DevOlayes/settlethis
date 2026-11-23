import * as THREE from "three";

export type NativeBipedJointProfile = {
  bone: THREE.Bone;
  track: THREE.QuaternionKeyframeTrack;
  axis: THREE.Vector3;
  reference: THREE.Quaternion;
  maxExcursion: number;
};

export type NativeBipedPoseEntry = {
  profile?: NativeBipedJointProfile;
  angles: number[];
};

function normalizedName(value: string): string {
  return value.trim().replace(/_/g, " ").replace(/\s+/g, " ").toLowerCase();
}

function readQuaternionAtFrame(track: THREE.QuaternionKeyframeTrack, frame: number): THREE.Quaternion {
  const offset = frame * 4;
  return new THREE.Quaternion(
    track.values[offset],
    track.values[offset + 1],
    track.values[offset + 2],
    track.values[offset + 3],
  ).normalize();
}

/**
 * Derive the actual local swing axis from every decoded keyframe in the
 * approved native run. The largest excursion fixes the sign; covariance
 * across the complete cycle stabilizes the axis against small frame noise.
 */
export function getNativeBipedJointProfile(
  referenceRunClip: THREE.AnimationClip,
  bone: THREE.Bone | undefined,
): NativeBipedJointProfile | undefined {
  if (!bone) return undefined;
  const target = normalizedName(bone.name);
  const track = referenceRunClip.tracks.find((candidate) =>
    candidate instanceof THREE.QuaternionKeyframeTrack &&
    candidate.name.endsWith(".quaternion") &&
    normalizedName(candidate.name.slice(0, -".quaternion".length)) === target,
  ) as THREE.QuaternionKeyframeTrack | undefined;
  if (!track || track.times.length < 3) return undefined;

  const reference = readQuaternionAtFrame(track, 0);
  const covariance = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const dominantAxis = new THREE.Vector3(1, 0, 0);
  let maxExcursion = 0;

  for (let frame = 0; frame < track.times.length; frame++) {
    const current = readQuaternionAtFrame(track, frame);
    const delta = reference.clone().invert().multiply(current).normalize();
    if (delta.w < 0) delta.set(-delta.x, -delta.y, -delta.z, -delta.w);
    const vector = new THREE.Vector3(delta.x, delta.y, delta.z);
    const length = vector.length();
    if (length < 1e-7) continue;
    const angle = 2 * Math.atan2(length, THREE.MathUtils.clamp(delta.w, -1, 1));
    const axis = vector.multiplyScalar(1 / length);
    const weighted = axis.multiplyScalar(angle);
    const values = [weighted.x, weighted.y, weighted.z];
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) covariance[row][column] += values[row] * values[column];
    }
    if (angle > maxExcursion) {
      maxExcursion = angle;
      dominantAxis.copy(axis);
    }
  }

  if (maxExcursion < 0.025) return undefined;

  // Power iteration obtains the dominant direction of the full-cycle
  // rotational covariance. Align its sign to the largest observed swing.
  let axis = dominantAxis.clone();
  for (let iteration = 0; iteration < 32; iteration++) {
    const next = new THREE.Vector3(
      covariance[0][0] * axis.x + covariance[0][1] * axis.y + covariance[0][2] * axis.z,
      covariance[1][0] * axis.x + covariance[1][1] * axis.y + covariance[1][2] * axis.z,
      covariance[2][0] * axis.x + covariance[2][1] * axis.y + covariance[2][2] * axis.z,
    );
    if (next.lengthSq() > 1e-12) axis.copy(next.normalize());
  }
  if (axis.dot(dominantAxis) < 0) axis.negate();

  return { bone, track, axis: axis.normalize(), reference, maxExcursion };
}

/**
 * Build a pose from the exact first-frame rotations in the native run clip.
 * Additive clips are converted against that same run frame, so their values
 * become pure local joint deltas and can overlay the uninterrupted gait.
 */
export function createNativeBipedPoseClip(
  name: string,
  duration: number,
  referenceRunClip: THREE.AnimationClip,
  times: number[],
  entries: NativeBipedPoseEntry[],
  additive: boolean,
): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  for (const entry of entries) {
    const profile = entry.profile;
    if (!profile || entry.angles.length !== times.length) continue;
    const values: number[] = [];
    for (const angle of entry.angles) {
      const delta = new THREE.Quaternion().setFromAxisAngle(profile.axis, angle);
      const pose = profile.reference.clone().multiply(delta).normalize();
      values.push(pose.x, pose.y, pose.z, pose.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(
      `${profile.bone.name}.quaternion`, times, values,
    ));
  }

  const clip = new THREE.AnimationClip(name, duration, tracks);
  if (additive) {
    THREE.AnimationUtils.makeClipAdditive(clip, 0, referenceRunClip, 30);
    clip.blendMode = THREE.AdditiveAnimationBlendMode;
  }
  clip.optimize();
  return clip;
}

function solveCcdChain(
  model: THREE.Object3D,
  effector: THREE.Object3D,
  target: THREE.Vector3,
  joints: THREE.Bone[],
  iterations = 7,
): number {
  const identity = new THREE.Quaternion();
  const maxStep = 0.34;
  for (let iteration = 0; iteration < iterations; iteration++) {
    model.updateMatrixWorld(true);
    const error = effector.getWorldPosition(new THREE.Vector3()).distanceTo(target);
    if (error < 0.018) break;

    for (const joint of joints) {
      model.updateMatrixWorld(true);
      const effectorPosition = effector.getWorldPosition(new THREE.Vector3());
      const jointPosition = joint.getWorldPosition(new THREE.Vector3());
      const toEffector = effectorPosition.sub(jointPosition);
      const toTarget = target.clone().sub(jointPosition);
      if (toEffector.lengthSq() < 1e-8 || toTarget.lengthSq() < 1e-8) continue;
      toEffector.normalize();
      toTarget.normalize();

      const dot = THREE.MathUtils.clamp(toEffector.dot(toTarget), -1, 1);
      if (dot > 0.99999) continue;
      const deltaWorld = new THREE.Quaternion().setFromUnitVectors(toEffector, toTarget);
      const angle = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(deltaWorld.w), -1, 1));
      if (angle > maxStep) deltaWorld.slerp(identity, 1 - maxStep / angle);

      const jointWorld = joint.getWorldQuaternion(new THREE.Quaternion());
      const nextWorld = deltaWorld.multiply(jointWorld);
      const parentWorld = joint.parent
        ? joint.parent.getWorldQuaternion(new THREE.Quaternion())
        : new THREE.Quaternion();
      joint.quaternion.copy(parentWorld.invert().multiply(nextWorld));
      model.updateMatrixWorld(true);
    }
  }
  model.updateMatrixWorld(true);
  return effector.getWorldPosition(new THREE.Vector3()).distanceTo(target);
}

export type NativeBipedSlideContactRig = {
  solve(groundY: number): { shoulder: number; palm: number; leadFoot: number; trailingFoot: number };
};

function findBone(model: THREE.Object3D, name: string): THREE.Bone | undefined {
  const wanted = normalizedName(name);
  let result: THREE.Bone | undefined;
  model.traverse((object) => {
    if (result || !(object instanceof THREE.Bone)) return;
    if (normalizedName(object.name) === wanted) result = object;
  });
  return result;
}

/**
 * Ground contacts are solved against the actual scaled, rotated player model.
 * The skeleton hierarchy is untouched; only its existing joint rotations are
 * adjusted after the slide pose is evaluated by the animation mixer.
 */
export function createNativeBipedSlideContactRig(
  model: THREE.Object3D,
): NativeBipedSlideContactRig | undefined {
  const leftHand = findBone(model, "Bip01 L Hand");
  const leftForearm = findBone(model, "Bip01 L Forearm");
  const leftUpperArm = findBone(model, "Bip01 L UpperArm");
  const leftClavicle = findBone(model, "Bip01 L Clavicle");
  const neck = findBone(model, "Bip01 Neck");
  const spine = findBone(model, "Bip01 Spine");
  const spine1 = findBone(model, "Bip01 Spine1");
  const spine2 = findBone(model, "Bip01 Spine2");
  const leftToe = findBone(model, "Bip01 L Toe0");
  const rightToe = findBone(model, "Bip01 R Toe0");
  const leftFoot = findBone(model, "Bip01 L Foot");
  const leftCalf = findBone(model, "Bip01 L Calf");
  const leftThigh = findBone(model, "Bip01 L Thigh");
  const rightFoot = findBone(model, "Bip01 R Foot");
  const rightCalf = findBone(model, "Bip01 R Calf");
  const rightThigh = findBone(model, "Bip01 R Thigh");

  if (!leftHand || !leftForearm || !leftUpperArm || !leftClavicle ||
      !neck || !spine || !spine1 || !spine2 ||
      !leftToe || !rightToe || !leftFoot || !leftCalf || !leftThigh ||
      !rightFoot || !rightCalf || !rightThigh) return undefined;

  const palm = new THREE.Object3D();
  palm.name = "sethis-slide-palm-contact";
  palm.position.set(0.12, 0, 0);
  leftHand.add(palm);

  const targetAtHeight = (x: number, z: number, worldY: number) => {
    model.updateMatrixWorld(true);
    const point = model.localToWorld(new THREE.Vector3(x, 0, z));
    point.y = worldY;
    return point;
  };
  const targetAt = (x: number, z: number, groundY: number) =>
    targetAtHeight(x, z, groundY + 0.008);

  return {
    solve(groundY: number) {
      // First lower the shoulder girdle through the existing spine chain. This
      // brings the arm's root within anatomical reach before hand IK runs.
      const shoulderError = solveCcdChain(
        model, leftClavicle, targetAtHeight(-0.35, -0.05, groundY + 0.72),
        [neck, spine2, spine1, spine], 7,
      );
      const palmError = solveCcdChain(
        model, palm, targetAt(-0.34, -0.16, groundY),
        [leftForearm, leftUpperArm, leftClavicle], 14,
      );
      const leadFootError = solveCcdChain(
        model, leftToe, targetAt(-0.14, 0.44, groundY),
        [leftFoot, leftCalf, leftThigh], 14,
      );
      const trailingFootError = solveCcdChain(
        model, rightToe, targetAt(0.14, 0.04, groundY),
        [rightFoot, rightCalf, rightThigh], 10,
      );
      return { shoulder: shoulderError, palm: palmError, leadFoot: leadFootError, trailingFoot: trailingFootError };
    },
  };
}
