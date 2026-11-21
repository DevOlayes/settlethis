import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const animationRoot = path.join(root, "public/assets/football-runner/animations");
const sourceUrl = "https://models.codelove.in/animations/m_run_neutral_01.glb";
const expectedSha256 = "35759e3225f62bcf879cb115eafcbbd815ccdf4e776196a651abf5b097d1637f";
const response = await fetch(sourceUrl, { redirect: "follow" });
if (!response.ok) throw new Error(`Native Biped run download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const digest = createHash("sha256").update(bytes).digest("hex");
if (digest !== expectedSha256) throw new Error(`Native Biped run checksum mismatch: ${digest}`);
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) throw new Error("Not a GLB v2 file");
let offset = 12, json;
while (offset + 8 <= bytes.length) {
  const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true);
  offset += 8;
  const chunk = bytes.subarray(offset, offset + length);
  if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8").trim());
  offset += length;
}
const animation = json?.animations?.find((item) => item.name === "Take 001");
if (!animation || animation.channels.length !== 54) throw new Error("Unexpected native run animation structure");
const channelNames = animation.channels.map((channel) => json.nodes[channel.target.node]?.name);
for (const required of ["Bip01", "Bip01 Pelvis", "Bip01 L Thigh", "Bip01 R Thigh", "Bip01 L Calf", "Bip01 R Calf", "Bip01 L UpperArm", "Bip01 R UpperArm"]) {
  if (!channelNames.includes(required)) throw new Error(`Missing Biped channel: ${required}`);
}
await mkdir(animationRoot, { recursive: true });
await writeFile(path.join(animationRoot, "m_run_neutral_01.glb"), bytes);
const manifestPath = path.join(animationRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.version = 2;
manifest.clips = (manifest.clips || []).filter((clip) => clip.name !== "xbot-run");
manifest.clips.unshift({
  name: "sports-male-03-native-run",
  url: "/assets/football-runner/animations/m_run_neutral_01.glb",
  format: "native-biped-glb",
  includeAnimations: ["Take 001"],
  source: sourceUrl,
  license: "MIT",
  sha256: digest,
  channels: animation.channels.length
});
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ bytes: bytes.length, sha256: digest, channels: animation.channels.length }));
