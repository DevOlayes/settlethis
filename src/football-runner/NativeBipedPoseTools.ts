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
 * Use the exact run clip for bone-track identity and the first-frame reference
 * pose. Derive each flexion axis from the actual parent/child geometry of the
 * Sports Male 03 skeleton, with positive rotation defined as forward flexion.
 */
export function getNativeBipedJointProfile(
  referenceRunClip: THREE.AnimationClip,
  bone: THREE.Bone | undefined,
  model: THREE.Object3D,
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

  // Use the actual Sports Male 03 hierarchy to derive anatomical flexion.
  // The run clip supplies the reference pose and exact bone-track mapping;
  // its gait's dominant rotational axis is NOT a joint hinge axis.
  model.updateWorldMatrix(true, true);
  const childBones = bone.children.filter((child): child is THREE.Bone => child instanceof THREE.Bone);
  const child = normalizedName(bone.name) === "bip01 pelvis"
    ? childBones.find((candidate) => /spine/i.test(candidate.name)) ?? childBones[0]
    : childBones[0];
  if (!child || child.position.lengthSq() < 1e-8) return undefined;

  const modelWorld = model.getWorldQuaternion(new THREE.Quaternion());
  const forwardWorld = new THREE.Vector3(0, 0, 1).applyQuaternion(modelWorld).normalize();
  const upWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(modelWorld).normalize();
  const inverseBoneWorld = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
  const forwardLocal = forwardWorld.clone().applyQuaternion(inverseBoneWorld).normalize();
  const upLocal = upWorld.clone().applyQuaternion(inverseBoneWorld).normalize();
  const segmentLocal = child.position.clone().normalize();

  // Positive flexion must move the child segment toward the player's forward
  // direction. This is calculated from the real parent/child geometry, so
  // mirrored left/right joints naturally receive opposite local axis signs.
  let axis = segmentLocal.clone().cross(forwardLocal);
  const footLike = axis.lengthSq() < 1e-8;
  if (footLike) axis = forwardLocal.clone().cross(upLocal);
  if (axis.lengthSq() < 1e-8) return undefined;
  axis.normalize();
  const positiveMotion = axis.clone().cross(segmentLocal);
  const signReference = footLike ? upLocal : forwardLocal;
  if (positiveMotion.dot(signReference) < 0) axis.negate();

  let maxExcursion = 0;
  for (let frame = 0; frame < track.times.length; frame++) {
    const current = readQuaternionAtFrame(track, frame);
    const delta = reference.clone().invert().multiply(current).normalize();
    const angle = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(delta.w), -1, 1));
    maxExcursion = Math.max(maxExcursion, angle);
  }

  return { bone, track, axis, reference, maxExcursion };
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

export function addNativeBipedStaticTracks(
  clip: THREE.AnimationClip,
  bones: Array<THREE.Bone | undefined>,
  times: number[],
): void {
  for (const bone of bones) {
    if (!bone) continue;
    const q = bone.quaternion.clone().normalize();
    const values: number[] = [];
    for (let index = 0; index < times.length; index++) values.push(q.x, q.y, q.z, q.w);
    clip.tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values));
  }
}

export type NativeBipedSlideContactRig = {
  restore(): void;
  clear(): void;
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
  const leftToe = findBone(model, "Bip01 L Toe0");
  const rightToe = findBone(model, "Bip01 R Toe0");
  const leftFoot = findBone(model, "Bip01 L Foot");
  const leftCalf = findBone(model, "Bip01 L Calf");
  const leftThigh = findBone(model, "Bip01 L Thigh");
  const rightFoot = findBone(model, "Bip01 R Foot");
  const rightCalf = findBone(model, "Bip01 R Calf");
  const rightThigh = findBone(model, "Bip01 R Thigh");

  if (!leftHand || !leftForearm || !leftUpperArm || !leftClavicle ||
      !leftToe || !rightToe || !leftFoot || !leftCalf || !leftThigh ||
      !rightFoot || !rightCalf || !rightThigh) return undefined;

  const palm = new THREE.Object3D();
  palm.name = "sethis-slide-palm-contact";
  palm.position.set(0.12, -0.035, 0);
  leftHand.add(palm);

  // IK mutates joint quaternions after the mixer has evaluated a frame.
  // Preserve the pre-IK animated pose so it can be restored before the next
  // mixer update; otherwise joints without changing key values can accumulate
  // manual rotations over successive frames.
  const solvedBones = [
    leftHand, leftForearm, leftUpperArm, leftClavicle,
    leftFoot, leftCalf, leftThigh, rightFoot, rightCalf, rightThigh,
  ];
  const savedPose = new Map<THREE.Bone, THREE.Quaternion>();

  const targetAtHeight = (x: number, z: number, worldY: number) => {
    model.updateMatrixWorld(true);
    const point = model.localToWorld(new THREE.Vector3(x, 0, z));
    point.y = worldY;
    return point;
  };
  const targetAt = (x: number, z: number, groundY: number) =>
    targetAtHeight(x, z, groundY + 0.008);

  return {
    restore() {
      for (const [bone, quaternion] of savedPose) bone.quaternion.copy(quaternion);
      model.updateMatrixWorld(true);
    },
    clear() {
      savedPose.clear();
    },
    solve(groundY: number) {
      savedPose.clear();
      for (const bone of solvedBones) savedPose.set(bone, bone.quaternion.clone());
      // Keep the authored torso and head pose fixed. The previous solver
      // dragged the neck and spine to reposition the shoulder, creating the
      // twisted, head-bent slide. Measure shoulder reach without changing it.
      model.updateMatrixWorld(true);
      const shoulderTarget = targetAtHeight(-0.35, -0.05, groundY + 0.72);
      const shoulderError = leftClavicle.getWorldPosition(new THREE.Vector3())
        .distanceTo(shoulderTarget);
      const orientPalmDown = () => {
        model.updateMatrixWorld(true);
        const handWorld = leftHand.getWorldQuaternion(new THREE.Quaternion());
        const currentNormal = new THREE.Vector3(0, -1, 0).applyQuaternion(handWorld).normalize();
        const correction = new THREE.Quaternion().setFromUnitVectors(
          currentNormal, new THREE.Vector3(0, -1, 0),
        );
        const nextWorld = correction.multiply(handWorld);
        const parentWorld = leftHand.parent
          ? leftHand.parent.getWorldQuaternion(new THREE.Quaternion())
          : new THREE.Quaternion();
        leftHand.quaternion.copy(parentWorld.invert().multiply(nextWorld));
        model.updateMatrixWorld(true);
      };
      // The skinned hand surface sat 2.7cm above the pitch at the first
      // measured pose; lower its palm target to bring the actual mesh into contact.
      const palmTarget = targetAtHeight(-0.34, -0.16, groundY - 0.02);
      for (let pass = 0; pass < 4; pass++) {
        orientPalmDown();
        solveCcdChain(
          model, palm, palmTarget,
          [leftForearm, leftUpperArm, leftClavicle], 10,
        );
      }
      orientPalmDown();
      const palmError = palm.getWorldPosition(new THREE.Vector3()).distanceTo(palmTarget);
      const leadFootError = solveCcdChain(
        model, leftToe, targetAtHeight(-0.14, 0.44, groundY + 0.11),
        [leftFoot, leftCalf, leftThigh], 14,
      );
      const trailingFootError = solveCcdChain(
        model, rightToe, targetAtHeight(0.14, 0.04, groundY + 0.112),
        [rightFoot, rightCalf, rightThigh], 10,
      );
      return { shoulder: shoulderError, palm: palmError, leadFoot: leadFootError, trailingFoot: trailingFootError };
    },
  };
}
