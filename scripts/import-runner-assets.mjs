import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, copyFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const root = process.cwd();
const assetRoot = path.join(root, "public/assets/football-runner");
const animationRoot = path.join(assetRoot, "animations");
const tempRoot = await mkdir(path.join(os.tmpdir(), "sethis-runner-assets"), { recursive: true }).then(() => path.join(os.tmpdir(), "sethis-runner-assets"));

const EXPECTED_JOINT_SIGNATURE = "56da14a62acd90b00d5e6bece26cd47a49dd87189b23419d55166fdc8c057ba1";
const UPLOADED_MODEL_SHA256 = "ad4b96ce02b6856c73cf3045631d49981b4f896898b1c1097b3339410ad3e590";
const PACKS = [
  {
    id: "ual1",
    uploadId: "17958403",
    slug: "universal-animation-library",
    sha256: "cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724",
    file: "UAL1_Standard.glb",
    destination: "UAL1_Standard.glb",
    include: ["Jog_Fwd_Loop", "Sprint_Loop", "Jump_Start", "Jump_Loop", "Jump_Land", "Crouch_Fwd_Loop", "Crouch_Idle_Loop"],
    required: ["Jog_Fwd_Loop", "Sprint_Loop", "Jump_Start", "Jump_Loop", "Jump_Land", "Crouch_Fwd_Loop"],
    source: "Quaternius Universal Animation Library 1 Standard",
  },
  {
    id: "ual2",
    uploadId: "17958478",
    slug: "universal-animation-library-2",
    sha256: "4008ea208a604773a2b2177d965f0f5d3195498b5bf838c3f5785d68e95f2a68",
    file: "UAL2_Standard.glb",
    destination: "UAL2_Standard.glb",
    include: ["Slide_Start", "Slide_Loop", "Slide_Exit", "NinjaJump_Start", "NinjaJump_Idle_Loop", "NinjaJump_Land"],
    required: ["Slide_Start", "Slide_Loop", "Slide_Exit"],
    source: "Quaternius Universal Animation Library 2 Standard",
  },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseGlb(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
    throw new Error("Downloaded asset is not a GLB v2 file");
  }
  let offset = 12;
  let json;
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    offset += 8;
    const chunk = bytes.subarray(offset, offset + length);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(chunk).trim());
    offset += length;
  }
  if (!json) throw new Error("GLB has no JSON chunk");
  return json;
}

function jointSignature(json) {
  const skin = json.skins?.[0];
  if (!skin) return "";
  const names = skin.joints.map((index) => json.nodes?.[index]?.name || "").sort();
  return sha256(Buffer.from(names.join("\n")));
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
  return bytes;
}

function findModel(catalog) {
  const models = Array.isArray(catalog.models) ? catalog.models : [];
  return models.find((item) =>
    [item.name, item.title, item.label, item.slug, item.id]
      .filter(Boolean)
      .some((value) => {
        const normalized = String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");
        return normalized.includes("sports male 03") || normalized.includes("male athlete 03");
      }),
  );
}

async function walk(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else found.push(full);
  }
  return found;
}

await mkdir(animationRoot, { recursive: true });
const catalogResponse = await fetch("https://models.codelove.in/catalog.json");
if (!catalogResponse.ok) throw new Error(`CodeLove catalog request failed: ${catalogResponse.status}`);
const catalog = await catalogResponse.json();
const model = findModel(catalog);
if (!model?.glb) {
  throw new Error("Could not resolve Male Athlete 03 GLB path from CodeLove catalog: " +
    JSON.stringify({ keys: Object.keys(catalog), modelCount: catalog.models?.length || 0 }));
}
const modelUrl = new URL(model.glb, catalog.url || "https://models.codelove.in/").href;
const modelBytes = await download(modelUrl, path.join(tempRoot, "Sports_Male_03.glb"));
const modelJson = parseGlb(modelBytes);
const modelSignature = jointSignature(modelJson);
const jointCount = modelJson.skins?.[0]?.joints?.length || 0;
const imageCount = modelJson.images?.length || 0;
const materialCount = modelJson.materials?.length || 0;
const triangleCount = modelJson.meshes?.reduce((sum, mesh) =>
  sum + (mesh.primitives || []).reduce((inner, primitive) => {
    const accessor = modelJson.accessors?.[primitive.indices];
    return inner + (accessor?.count || 0) / 3;
  }, 0), 0) || 0;

if (!String(modelJson.asset?.copyright || "").includes("Microsoft") ||
    jointCount !== 80 || imageCount !== 5 || materialCount !== 3 ||
    modelSignature !== EXPECTED_JOINT_SIGNATURE) {
  throw new Error("Downloaded Male Athlete 03 did not match the inspected Library avatar. " +
    JSON.stringify({ copyright: modelJson.asset?.copyright, jointCount, imageCount, materialCount, modelSignature }));
}
const modelHash = sha256(modelBytes);
console.log("Avatar asset verified:", JSON.stringify({
  modelUrl, bytes: modelBytes.length, sha256: modelHash,
  exactLibraryFileMatch: modelHash === UPLOADED_MODEL_SHA256,
  jointCount, imageCount, materialCount, triangleCount: Math.round(triangleCount),
}));
await writeFile(path.join(assetRoot, "player.glb"), modelBytes);
const licenseText = modelJson.asset?.extras?.licenseText;
if (!licenseText || !licenseText.includes("Copyright (c) 2020 Microsoft")) {
  throw new Error("Microsoft MIT licence text was not embedded in the avatar GLB");
}
await writeFile(path.join(assetRoot, "LICENSE-MICROSOFT.txt"), licenseText + "\n");

const manifestClips = [];
const sourcePacks = [];
for (const pack of PACKS) {
  const endpoint = `https://quaternius.itch.io/${pack.slug}/file/${pack.uploadId}?source=game_download&as_props=1`;
  const linkResponse = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json" } });
  const linkText = await linkResponse.text();
  if (!linkResponse.ok) throw new Error(`Quaternius download-link request failed (${linkResponse.status}): ${linkText.slice(0, 300)}`);
  let linkPayload;
  try { linkPayload = JSON.parse(linkText); }
  catch { throw new Error(`Unexpected Quaternius download-link response: ${linkText.slice(0, 500)}`); }
  const downloadUrl = linkPayload.url || linkPayload.download_url || linkPayload.download;
  if (!downloadUrl) throw new Error(`No signed download URL returned for ${pack.id}: ${linkText.slice(0, 500)}`);

  const zipPath = path.join(tempRoot, `${pack.id}.zip`);
  const zipBytes = await download(downloadUrl, zipPath);
  const zipHash = sha256(zipBytes);
  if (zipHash !== pack.sha256) {
    throw new Error(`${pack.id} source ZIP checksum mismatch: expected ${pack.sha256}, got ${zipHash}`);
  }

  const extractPath = path.join(tempRoot, pack.id);
  await mkdir(extractPath, { recursive: true });
  execFileSync("unzip", ["-q", zipPath, "-d", extractPath]);
  const files = await walk(extractPath);
  const glbPath = files.find((file) => path.basename(file) === pack.file);
  if (!glbPath) throw new Error(`Could not find ${pack.file} in official ${pack.id} archive`);
  const glbBytes = await readFile(glbPath);
  const glbJson = parseGlb(glbBytes);
  const animationNames = (glbJson.animations || []).map((animation) => animation.name).filter(Boolean);
  const missing = pack.required.filter((required) => !animationNames.some((name) => name.toLowerCase() === required.toLowerCase()));
  if (missing.length) {
    throw new Error(`${pack.id} is missing required animation clips: ${missing.join(", ")}. Available: ${animationNames.join(", ")}`);
  }
  const selected = animationNames.filter((name) => pack.include.some((include) => name.toLowerCase() === include.toLowerCase()));
  if (!selected.length) throw new Error(`No selected clips found in ${pack.id}`);

  const destination = path.join(animationRoot, pack.destination);
  await copyFile(glbPath, destination);
  manifestClips.push({
    name: pack.id,
    url: `/assets/football-runner/animations/${pack.destination}`,
    includeAnimations: selected,
    source: pack.source,
    license: "CC0-1.0",
  });
  sourcePacks.push({
    name: pack.source,
    source: pack.id === "ual1"
      ? "https://quaternius.itch.io/universal-animation-library"
      : "https://quaternius.itch.io/universal-animation-library-2",
    license: "CC0-1.0",
    sha256: zipHash,
    originalArchiveBytes: zipBytes.length,
    bundledGlbBytes: glbBytes.length,
    bundledAnimationNames: selected,
  });
  console.log(`${pack.id} verified:`, JSON.stringify({
    archiveBytes: zipBytes.length, archiveSha256: zipHash,
    glbBytes: glbBytes.length, availableAnimations: animationNames.length,
    selectedAnimations: selected,
  }));
}

const quaterniusLicense = (await walk(tempRoot)).find((file) =>
  /license/i.test(path.basename(file)) && /ual1|ual2/i.test(file),
);
if (quaterniusLicense) {
  await copyFile(quaterniusLicense, path.join(animationRoot, "LICENSE-QUATERNIUS.txt"));
} else {
  await writeFile(path.join(animationRoot, "LICENSE-QUATERNIUS.txt"),
    "Quaternius Universal Animation Library 1 and 2 Standard assets are released under CC0 1.0 Universal.\n" +
    "Source: https://quaternius.com/packs/universalanimationlibrary.html and https://quaternius.com/packs/universalanimationlibrary2.html\n");
}

const manifest = {
  version: 1,
  avatar: {
    name: "Sports Male 03 / Male Athlete 03",
    source: "https://models.codelove.in/models/sports-male-03/",
    license: "MIT",
    exactLibraryUploadSha256: UPLOADED_MODEL_SHA256,
    bundledSha256: modelHash,
    exactLibraryFileMatch: modelHash === UPLOADED_MODEL_SHA256,
  },
  sourcePacks,
  clips: manifestClips,
};
await writeFile(path.join(animationRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const assetReadme = [
  "# Football Runner avatar and animation assets",
  "",
  "## Avatar",
  "",
  "Sports Male 03 / Male Athlete 03, Microsoft Rocketbox model. The model is 9,534 triangles with an 80-joint Biped rig, five embedded textures and three materials. It is distributed under the MIT licence; retain LICENSE-MICROSOFT.txt.",
  "",
  "Source: https://models.codelove.in/models/sports-male-03/",
  "",
  "The asset importer verifies the model's Microsoft copyright metadata, 80-joint skeleton signature, five images and three materials against the file recovered from the user's Library. It records whether the downloaded source is byte-identical to that Library file in animations/manifest.json.",
  "",
  "## Animations",
  "",
  "- Quaternius Universal Animation Library 1 Standard: CC0 1.0.",
  "- Quaternius Universal Animation Library 2 Standard: CC0 1.0.",
  "- The bundled _Standard GLBs are in-place variants, not root-motion (_RM) variants. Game code owns the character's world movement.",
  "- Only the required movement clips are retargeted at runtime: jog/run, sprint, jump take-off/air/landing, crouch and slide start/loop/exit.",
  "- The full source pack ZIP hashes and selected clip names are recorded in animations/manifest.json.",
  "",
  "Sources:",
  "- https://quaternius.itch.io/universal-animation-library",
  "- https://quaternius.itch.io/universal-animation-library-2",
  "- https://quaternius.com/packs/universalanimationlibrary.html",
  "- https://quaternius.com/packs/universalanimationlibrary2.html",
  "",
  "The football collection kick is an original game-authored clip, not a third-party motion-capture asset."
].join(String.fromCharCode(10));
await writeFile(path.join(assetRoot, "README.md"), assetReadme);
console.log("Runner asset import complete.");
