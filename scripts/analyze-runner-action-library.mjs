import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { canonicalizeGLBBones, retargetClipToObject } from "@three-ws/retarget";

const normalize = (name) => name.replace(/_/g, " ").replace(/\\s+/g, " ").trim().toLowerCase();
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelBytes = await readFile("public/assets/football-runner/player.glb");
const modelBuffer = modelBytes.buffer.slice(modelBytes.byteOffset, modelBytes.byteOffset + modelBytes.byteLength);
const modelGltf = await loader.parseAsync(modelBuffer, "file:///");
const model = modelGltf.scene;
const bounds = new THREE.Box3().setFromObject(model);
const scale = 2.18 / Math.max(0.01, bounds.max.y - bounds.min.y);
model.scale.setScalar(scale);
model.position.y = -bounds.min.y * scale;
model.rotation.y = Math.PI;
model.updateMatrixWorld(true);
const bindPose = new Map();
model.traverse((object) => { if (object.isBone) bindPose.set(object, object.quaternion.clone()); });

function resetPose() {
  for (const [object, quaternion] of bindPose) object.quaternion.copy(quaternion);
  model.updateMatrixWorld(true);
}
function bone(name) {
  let found;
  model.traverse((object) => {
    if (!found && object.isBone && normalize(object.name) === normalize(name)) found = object;
  });
  return found;
}
function point(name) {
  const b = bone(name);
  return b ? b.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
}
function angle(a, b) {
  if (a.lengthSq() < 1e-8 || b.lengthSq() < 1e-8) return 0;
  return THREE.MathUtils.radToDeg(a.angleTo(b));
}
function metrics() {
  model.updateMatrixWorld(true);
  const pelvis = point("Bip01 Pelvis");
  const head = point("Bip01 Head");
  const leftHip = point("Bip01 L Thigh");
  const leftKnee = point("Bip01 L Calf");
  const leftAnkle = point("Bip01 L Foot");
  const rightHip = point("Bip01 R Thigh");
  const rightKnee = point("Bip01 R Calf");
  const rightAnkle = point("Bip01 R Foot");
  const leftShoulder = point("Bip01 L UpperArm");
  const leftElbow = point("Bip01 L Forearm");
  const leftHand = point("Bip01 L Hand");
  const torso = head.sub(pelvis);
  const forward = new THREE.Vector3(0, 0, -1);
  const horizontalTorso = new THREE.Vector3(torso.x, 0, torso.z);
  const torsoForwardLean = Math.atan2(horizontalTorso.dot(forward), Math.max(1e-6, torso.y));
  const leftKneeBend = 180 - angle(leftHip.clone().sub(leftKnee), leftAnkle.clone().sub(leftKnee));
  const rightKneeBend = 180 - angle(rightHip.clone().sub(rightKnee), rightAnkle.clone().sub(rightKnee));
  const leftElbowBend = 180 - angle(leftShoulder.clone().sub(leftElbow), leftHand.clone().sub(leftElbow));
  return {
    torsoForwardLeanDeg: Number(THREE.MathUtils.radToDeg(torsoForwardLean).toFixed(1)),
    pelvisY: Number(pelvis.y.toFixed(3)),
    headY: Number(head.y.toFixed(3)),
    leftKneeBendDeg: Number(leftKneeBend.toFixed(1)),
    rightKneeBendDeg: Number(rightKneeBend.toFixed(1)),
    leftElbowBendDeg: Number(leftElbowBend.toFixed(1)),
    leftHand: [Number(leftHand.x.toFixed(3)), Number(leftHand.y.toFixed(3)), Number(leftHand.z.toFixed(3))],
  };
}

const targets = [
  { file: "UAL1_Standard.pack", names: ["Jump_Start", "Jump_Loop", "Jump_Land"] },
  { file: "UAL2_Standard.pack", names: ["Slide_Start", "Slide_Loop", "Slide_Exit"] },
];
for (const pack of targets) {
  const compressed = await readFile("public/assets/football-runner/animations/" + pack.file);
  const raw = gunzipSync(compressed);
  const canonical = canonicalizeGLBBones(raw);
  const source = await loader.parseAsync(canonical.buffer, "file:///");
  for (const name of pack.names) {
    resetPose();
    const sourceClip = source.animations.find((clip) => normalize(clip.name) === normalize(name));
    if (!sourceClip) {
      console.log("ACTION_LIBRARY_MISSING", JSON.stringify({ file: pack.file, name }));
      continue;
    }
    const result = retargetClipToObject(sourceClip, model);
    if (!result.clip) {
      console.log("ACTION_LIBRARY_REJECTED", JSON.stringify({ file: pack.file, name, coverage: result.coverage, matched: result.matched, total: result.total }));
      continue;
    }
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(result.clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    const samples = [];
    const duration = Math.max(0.001, result.clip.duration);
    for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
      mixer.setTime(duration * fraction);
      samples.push({ t: Number((duration * fraction).toFixed(3)), ...metrics() });
    }
    console.log("ACTION_LIBRARY_AUDIT", JSON.stringify({
      file: pack.file, clip: sourceClip.name, duration: Number(duration.toFixed(3)),
      coverage: Number(result.coverage.toFixed(3)), tracks: result.clip.tracks.length,
      samples,
    }));
    mixer.stopAllAction();
    resetPose();
  }
}
