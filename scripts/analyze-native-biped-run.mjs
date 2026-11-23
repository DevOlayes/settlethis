import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const path = "public/assets/football-runner/animations/m_run_neutral_01.glb";
const bytes = await readFile(path);
const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.parseAsync(data, "file:///");
const clip = gltf.animations.find((item) => item.name === "Take 001");
if (!clip) throw new Error("Take 001 was not decoded from the source GLB");

const wanted = [
  "Bip01 Pelvis", "Bip01 Spine", "Bip01 Spine2", "Bip01 Neck", "Bip01 Head",
  "Bip01 L Clavicle", "Bip01 R Clavicle", "Bip01 L UpperArm", "Bip01 R UpperArm",
  "Bip01 L Forearm", "Bip01 R Forearm", "Bip01 L Hand", "Bip01 R Hand",
  "Bip01 L Thigh", "Bip01 R Thigh", "Bip01 L Calf", "Bip01 R Calf",
  "Bip01 L Foot", "Bip01 R Foot"
];
const normalize = (s) => s.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
const selected = new Map();
for (const track of clip.tracks) {
  if (!track.name.endsWith(".quaternion")) continue;
  const name = track.name.slice(0, -".quaternion".length);
  if (wanted.some((bone) => normalize(bone) === normalize(name))) selected.set(normalize(name), { name, track });
}
const round = (n) => Math.round(n * 10000) / 10000;
const deg = (r) => round(THREE.MathUtils.radToDeg(r));
console.log("AUDIT_META", JSON.stringify({
  source: path, animation: clip.name, duration: clip.duration,
  tracks: clip.tracks.length, selectedBones: selected.size,
  selected: [...selected.values()].map(({name, track}) => ({name, keys: track.times.length, first: track.times[0], last: track.times.at(-1)}))
}));

for (const bone of wanted) {
  const item = selected.get(normalize(bone));
  if (!item) { console.log("AUDIT_MISSING", bone); continue; }
  const {name, track} = item;
  const times = track.times;
  const interp = track.createInterpolant();
  const firstValues = interp.evaluate(times[0]);
  const q0 = new THREE.Quaternion(firstValues[0], firstValues[1], firstValues[2], firstValues[3]).normalize();
  const samples = [];
  const covariance = [[0,0,0],[0,0,0],[0,0,0]];
  let maxAngle = 0;
  let dominant = new THREE.Vector3(1,0,0);
  for (let i=0;i<times.length;i++) {
    const v = interp.evaluate(times[i]);
    const q = new THREE.Quaternion(v[0],v[1],v[2],v[3]).normalize();
    const delta = q0.clone().invert().multiply(q).normalize();
    if (delta.w < 0) delta.set(-delta.x,-delta.y,-delta.z,-delta.w);
    const vector = new THREE.Vector3(delta.x,delta.y,delta.z);
    const len = vector.length();
    const angle = len > 1e-8 ? 2 * Math.atan2(len, Math.max(-1, Math.min(1, delta.w))) : 0;
    const axis = len > 1e-8 ? vector.multiplyScalar(1/len) : new THREE.Vector3();
    const x = axis.x * angle, y = axis.y * angle, z = axis.z * angle;
    const p = [x,y,z];
    for (let r=0;r<3;r++) for (let c=0;c<3;c++) covariance[r][c] += p[r]*p[c];
    if (angle > maxAngle) { maxAngle = angle; dominant.copy(axis); }
    samples.push({frame:i,time:round(times[i]),angleDeg:deg(angle),axis:[round(axis.x),round(axis.y),round(axis.z)],q:[round(q.x),round(q.y),round(q.z),round(q.w)]});
  }
  let axis = dominant.clone();
  for (let i=0;i<32;i++) {
    const next = new THREE.Vector3(
      covariance[0][0]*axis.x+covariance[0][1]*axis.y+covariance[0][2]*axis.z,
      covariance[1][0]*axis.x+covariance[1][1]*axis.y+covariance[1][2]*axis.z,
      covariance[2][0]*axis.x+covariance[2][1]*axis.y+covariance[2][2]*axis.z
    );
    if (next.lengthSq() > 1e-12) axis.copy(next.normalize());
  }
  if (axis.dot(dominant) < 0) axis.negate();
  console.log("AUDIT_BONE", JSON.stringify({
    bone:name, frames:times.length, principalRunAxis:[round(axis.x),round(axis.y),round(axis.z)],
    maxExcursionDeg:deg(maxAngle), frameSamples:samples
  }));
}
