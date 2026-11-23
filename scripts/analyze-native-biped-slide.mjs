import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

await writeFile(new URL("../.tmp-audit/package.json", import.meta.url), '{"type":"module"}');
const compiledManeuvers = new URL("../.tmp-audit/NativeBipedManeuvers.js", import.meta.url);
const maneuversSource = await readFile(compiledManeuvers, "utf8");
await writeFile(compiledManeuvers, maneuversSource.replace('from "./NativeBipedPoseTools"', 'from "./NativeBipedPoseTools.js"'));
const { createNativeBipedManeuverClips } = await import("../.tmp-audit/NativeBipedManeuvers.js");
const { createNativeBipedSlideContactRig } = await import("../.tmp-audit/NativeBipedPoseTools.js");

function rewriteWithoutTextures(input) {
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
      const json = JSON.parse(bytes.subarray(start, end).toString("utf8").replace(/\0+$/g, "").trim());
      delete json.images;
      delete json.textures;
      delete json.samplers;
      delete json.materials;
      for (const mesh of json.meshes ?? []) {
        for (const primitive of mesh.primitives ?? []) delete primitive.material;
      }
      json.extensionsUsed = (json.extensionsUsed ?? []).filter((name) => name !== "EXT_texture_webp");
      json.extensionsRequired = (json.extensionsRequired ?? []).filter((name) => name !== "EXT_texture_webp");
      const encoded = Buffer.from(JSON.stringify(json));
      const padded = Buffer.alloc((encoded.length + 3) & ~3, 0x20);
      encoded.copy(padded);
      chunks.push({ type, data: padded });
    } else {
      chunks.push({ type, data: bytes.subarray(start, end) });
    }
    offset = end;
  }
  const total = 12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
  const output = Buffer.alloc(total);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(total, 8);
  let cursor = 12;
  for (const chunk of chunks) {
    output.writeUInt32LE(chunk.data.length, cursor);
    output.writeUInt32LE(chunk.type, cursor + 4);
    chunk.data.copy(output, cursor + 8);
    cursor += 8 + chunk.data.length;
  }
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

async function parseGlb(path, stripTextures = false) {
  const bytes = await readFile(path);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader.parseAsync(stripTextures ? rewriteWithoutTextures(buffer) : buffer, "file:///");
}

const loaded = await parseGlb("public/assets/football-runner/player.glb", true);
const model = loaded.scene;
model.name = "slide-contact-audit-model";
const bounds = new THREE.Box3().setFromObject(model);
const height = Math.max(0.01, bounds.max.y - bounds.min.y);
const scale = 2.18 / height;
model.scale.setScalar(scale);
const baseY = -bounds.min.y * scale;
model.position.y = baseY - 0.46;
model.rotation.y = Math.PI;
model.updateMatrixWorld(true);

const source = await parseGlb("public/assets/football-runner/animations/m_run_neutral_01.glb");
const sourceClip = source.animations.find((clip) => clip.name === "Take 001");
if (!sourceClip) throw new Error("Could not decode the approved native run clip");
const tracks = sourceClip.tracks.filter((track) => !/^Bip01(?:_| )?\.(?:position|quaternion)$/.test(track.name));
const run = new THREE.AnimationClip("sports-male-03-native-run", sourceClip.duration, tracks);
const maneuvers = createNativeBipedManeuverClips(model, run);
const [slideStart, slideLoop] = maneuvers;
if (!slideStart?.tracks.length || !slideLoop?.tracks.length) throw new Error("Slide clips were not generated");

const mixer = new THREE.AnimationMixer(model);
const startAction = mixer.clipAction(slideStart);
startAction.setLoop(THREE.LoopOnce, 1);
startAction.clampWhenFinished = true;
startAction.play();
mixer.update(slideStart.duration);
const contactRig = createNativeBipedSlideContactRig(model);
if (!contactRig) throw new Error("Could not create the slide contact chains");
const startErrors = contactRig.solve(-0.12);

const loopAction = mixer.clipAction(slideLoop);
loopAction.setLoop(THREE.LoopRepeat, Infinity);
loopAction.play();
mixer.update(0.29);
const loopErrors = contactRig.solve(-0.12);

console.log("SLIDE_CONTACT_AUDIT", JSON.stringify({
  modelHeight: Number(height.toFixed(4)),
  modelScale: Number(scale.toFixed(4)),
  baseY: Number(baseY.toFixed(4)),
  rootDrop: 0.46,
  pitchY: -0.12,
  targetY: -0.112,
  slideStart: Object.fromEntries(Object.entries(startErrors).map(([k,v])=>[k,Number(v.toFixed(4))])),
  slideLoop: Object.fromEntries(Object.entries(loopErrors).map(([k,v])=>[k,Number(v.toFixed(4))])),
}));
