import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

await readFile(".tmp-audit/NativeBipedJump.js", "utf8").then(async (source) => {
  const path = ".tmp-audit/NativeBipedJump.js";
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path, source.replace('from "./NativeBipedPoseTools"', 'from "./NativeBipedPoseTools.js"'));
});
const { createNativeBipedJumpClips } = await import("../.tmp-audit/NativeBipedJump.js");

function stripTextures(input) {
  const bytes = Buffer.from(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (type === 0x4e4f534a) {
      const json = JSON.parse(bytes.subarray(start, end).toString("utf8").replace(/\\0+$/g, "").trim());
      delete json.images; delete json.textures; delete json.samplers; delete json.materials;
      for (const mesh of json.meshes ?? []) for (const primitive of mesh.primitives ?? []) delete primitive.material;
      json.extensionsUsed = (json.extensionsUsed ?? []).filter((name) => name !== "EXT_texture_webp");
      json.extensionsRequired = (json.extensionsRequired ?? []).filter((name) => name !== "EXT_texture_webp");
      const encoded = Buffer.from(JSON.stringify(json));
      const padded = Buffer.alloc((encoded.length + 3) & ~3, 0x20);
      encoded.copy(padded);
      chunks.push({ type, data: padded });
    } else chunks.push({ type, data: bytes.subarray(start, end) });
    offset = end;
  }
  const total = 12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
  const output = Buffer.alloc(total);
  output.writeUInt32LE(0x46546c67, 0); output.writeUInt32LE(2, 4); output.writeUInt32LE(total, 8);
  let cursor = 12;
  for (const chunk of chunks) {
    output.writeUInt32LE(chunk.data.length, cursor); output.writeUInt32LE(chunk.type, cursor + 4);
    chunk.data.copy(output, cursor + 8); cursor += 8 + chunk.data.length;
  }
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelBytes = await readFile("public/assets/football-runner/player.glb");
const modelBuffer = modelBytes.buffer.slice(modelBytes.byteOffset, modelBytes.byteOffset + modelBytes.byteLength);
const modelGltf = await loader.parseAsync(stripTextures(modelBuffer), "file:///");
const model = modelGltf.scene;
const bounds = new THREE.Box3().setFromObject(model);
const scale = 2.18 / Math.max(0.01, bounds.max.y - bounds.min.y);
model.scale.setScalar(scale);
model.position.y = -bounds.min.y * scale;
model.rotation.y = Math.PI;
model.updateMatrixWorld(true);

const runBytes = await readFile("public/assets/football-runner/animations/m_run_neutral_01.glb");
const runBuffer = runBytes.buffer.slice(runBytes.byteOffset, runBytes.byteOffset + runBytes.byteLength);
const runGltf = await loader.parseAsync(runBuffer, "file:///");
const sourceRun = runGltf.animations.find((clip) => clip.name === "Take 001");
if (!sourceRun) throw new Error("Approved native run clip was not decoded");
const runTracks = sourceRun.tracks.filter((track) => !/^Bip01(?:_| )?\\.(?:position|quaternion)$/.test(track.name));
const run = new THREE.AnimationClip("sports-male-03-native-run", sourceRun.duration, runTracks);
const jumpClips = createNativeBipedJumpClips(model, run);
const bone = (name) => {
  let found;
  model.traverse((object) => { if (!found && object.isBone && object.name.replace(/_/g, " ").toLowerCase() === name.toLowerCase()) found = object; });
  return found;
};
const worldPoint = (name) => bone(name).getWorldPosition(new THREE.Vector3());
function measure() {
  model.updateMatrixWorld(true);
  const pelvis = worldPoint("Bip01 Pelvis");
  const head = worldPoint("Bip01 Head");
  const leftHip = worldPoint("Bip01 L Thigh");
  const leftKnee = worldPoint("Bip01 L Calf");
  const leftAnkle = worldPoint("Bip01 L Foot");
  const rightHip = worldPoint("Bip01 R Thigh");
  const rightKnee = worldPoint("Bip01 R Calf");
  const rightAnkle = worldPoint("Bip01 R Foot");
  const torso = head.clone().sub(pelvis);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(model.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const horizontal = new THREE.Vector3(torso.x, 0, torso.z);
  const lean = Math.atan2(horizontal.dot(forward), Math.max(1e-6, torso.y));
  const bend = (hip, knee, ankle) => 180 - THREE.MathUtils.radToDeg(hip.clone().sub(knee).angleTo(ankle.clone().sub(knee)));
  const headForward = new THREE.Vector3(0, 0, 1).applyQuaternion(bone("Bip01 Head").getWorldQuaternion(new THREE.Quaternion())).normalize();
  return {
    torsoForwardLeanDeg: Number(THREE.MathUtils.radToDeg(lean).toFixed(1)),
    leftKneeBendDeg: Number(bend(leftHip, leftKnee, leftAnkle).toFixed(1)),
    rightKneeBendDeg: Number(bend(rightHip, rightKnee, rightAnkle).toFixed(1)),
    headForwardErrorDeg: Number(THREE.MathUtils.radToDeg(headForward.angleTo(forward)).toFixed(1)),
  };
}

for (const clip of jumpClips) {
  const mixer = new THREE.AnimationMixer(model);
  const jumpAction = mixer.clipAction(clip);
  jumpAction.setLoop(THREE.LoopOnce, 1);
  jumpAction.clampWhenFinished = true;
  jumpAction.setEffectiveWeight(1);
  jumpAction.play();
  const samples = [];
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    mixer.setTime(clip.duration * fraction);
    samples.push({ t: Number((clip.duration * fraction).toFixed(3)), ...measure() });
  }
  console.log("NATIVE_JUMP_AUDIT", JSON.stringify({ clip: clip.name, duration: Number(clip.duration.toFixed(3)), samples }));
  mixer.stopAllAction();
}
