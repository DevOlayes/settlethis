import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { canonicalizeGLBBones, MIN_COVERAGE, parseClipJSON, retargetClipToObject } from "@three-ws/retarget";

export type LoadedRunnerCharacter = {
  model: THREE.Group;
  animations: THREE.AnimationClip[];
};

type RunnerAnimationAsset = {
  name?: string;
  url: string;
  includeAnimations?: string[];
  compression?: "gzip";
  format?: "canonical-json";
  source?: string;
  license?: string;
};

type RunnerAnimationManifest = {
  clips: RunnerAnimationAsset[];
};

function mapBipedBoneName(name: string): string {
  const prefix = "Bip01 ";
  if (!name.startsWith(prefix)) return name;
  const bone = name.slice(prefix.length);
  const exact: Record<string, string> = {
    Pelvis: "mixamorig:Hips",
    Spine: "mixamorig:Spine",
    Spine1: "mixamorig:Spine1",
    Spine2: "mixamorig:Spine2",
    Neck: "mixamorig:Neck",
    Head: "mixamorig:Head",
    "R Clavicle": "mixamorig:RightShoulder",
    "R UpperArm": "mixamorig:RightArm",
    "R Forearm": "mixamorig:RightForeArm",
    "R Hand": "mixamorig:RightHand",
    "L Clavicle": "mixamorig:LeftShoulder",
    "L UpperArm": "mixamorig:LeftArm",
    "L Forearm": "mixamorig:LeftForeArm",
    "L Hand": "mixamorig:LeftHand",
    "R Thigh": "mixamorig:RightUpLeg",
    "R Calf": "mixamorig:RightLeg",
    "R Foot": "mixamorig:RightFoot",
    "R Toe0": "mixamorig:RightToeBase",
    "L Thigh": "mixamorig:LeftUpLeg",
    "L Calf": "mixamorig:LeftLeg",
    "L Foot": "mixamorig:LeftFoot",
    "L Toe0": "mixamorig:LeftToeBase",
  };
  if (exact[bone]) return exact[bone];

  const finger = bone.match(/^([RL]) Finger(\d)(\d?)$/);
  if (finger) {
    const side = finger[1] === "R" ? "Right" : "Left";
    const digit = ["Thumb", "Index", "Middle", "Ring", "Pinky"][Number(finger[2])];
    const segment = finger[3] ? Number(finger[3]) + 1 : 1;
    if (digit && segment <= 3) return `mixamorig:${side}Hand${digit}${segment}`;
  }
  return name;
}

function rewriteGlbJson(
  input: ArrayBuffer,
  transform: (json: Record<string, unknown>) => void,
): ArrayBuffer {
  const inputBytes = new Uint8Array(input);
  const inputView = new DataView(input);
  if (inputView.getUint32(0, true) !== 0x46546c67 || inputView.getUint32(4, true) !== 2) {
    throw new Error("Expected a glTF binary (GLB v2) asset");
  }

  const chunks: Array<{ type: number; bytes: Uint8Array }> = [];
  let offset = 12;
  let foundJson = false;
  while (offset + 8 <= inputBytes.length) {
    const length = inputView.getUint32(offset, true);
    const type = inputView.getUint32(offset + 4, true);
    offset += 8;
    const bytes = inputBytes.slice(offset, offset + length);
    offset += length;

    if (type === 0x4e4f534a) {
      const json = JSON.parse(new TextDecoder().decode(bytes).trim()) as Record<string, unknown>;
      transform(json);
      const encoded = new TextEncoder().encode(JSON.stringify(json));
      const paddedLength = Math.ceil(encoded.length / 4) * 4;
      const padded = new Uint8Array(paddedLength);
      padded.fill(0x20);
      padded.set(encoded);
      chunks.push({ type, bytes: padded });
      foundJson = true;
    } else {
      chunks.push({ type, bytes });
    }
  }
  if (!foundJson) throw new Error("GLB JSON chunk is missing");

  const totalLength = 12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.bytes.length, 0);
  const output = new ArrayBuffer(totalLength);
  const outputBytes = new Uint8Array(output);
  const outputView = new DataView(output);
  outputView.setUint32(0, 0x46546c67, true);
  outputView.setUint32(4, 2, true);
  outputView.setUint32(8, totalLength, true);
  let writeOffset = 12;
  for (const chunk of chunks) {
    outputView.setUint32(writeOffset, chunk.bytes.length, true);
    outputView.setUint32(writeOffset + 4, chunk.type, true);
    writeOffset += 8;
    outputBytes.set(chunk.bytes, writeOffset);
    writeOffset += chunk.bytes.length;
  }
  return output;
}

function canonicalizeAvatarBuffer(raw: ArrayBuffer): ArrayBuffer {
  const mapped = rewriteGlbJson(raw, (json) => {
    const nodes = json.nodes;
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const item = node as { name?: unknown };
      if (typeof item.name === "string") item.name = mapBipedBoneName(item.name);
    }
  });
  return canonicalizeGLBBones(mapped).buffer;
}

async function decompressAnimationAsset(input: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support gzip animation asset decoding");
  }
  const compressed = new Blob([input]).stream();
  const decompressed = compressed.pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressed).arrayBuffer();
}

function createLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

/**
 * Loads the approved Sports Male 03 GLB from same-origin public assets.
 * The original Bip01 hierarchy is mapped into the retargeter's canonical
 * humanoid naming before the GLB is parsed. Meshopt decoding is enabled because
 * the source avatar uses EXT_meshopt_compression.
 */
export async function loadRunnerCharacter(
  url = "/assets/football-runner/player.glb",
): Promise<LoadedRunnerCharacter> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Unable to load footballer asset (${response.status})`);
  const raw = await response.arrayBuffer();
  const buffer = canonicalizeAvatarBuffer(raw);
  const gltf = await createLoader().parseAsync(buffer, new URL(".", window.location.href).href);
  const model = gltf.scene;
  model.name = "sethis-rigged-footballer";

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if ("roughness" in material && typeof material.roughness === "number") {
        material.roughness = Math.max(0.48, material.roughness);
      }
    });
  });

  const bounds = new THREE.Box3().setFromObject(model);
  const height = Math.max(0.01, bounds.max.y - bounds.min.y);
  const targetHeight = 2.18;
  const scale = targetHeight / height;
  model.scale.setScalar(scale);
  model.position.y = -bounds.min.y * scale;
  model.updateMatrixWorld(true);

  return { model, animations: gltf.animations };
}

export async function loadRunnerAnimationManifest(
  target: THREE.Object3D,
  manifestUrl = "/assets/football-runner/animations/manifest.json",
): Promise<THREE.AnimationClip[]> {
  try {
    const response = await fetch(manifestUrl, { cache: "force-cache" });
    if (!response.ok) return [];
    const manifest = await response.json() as RunnerAnimationManifest;
    if (!Array.isArray(manifest.clips)) return [];
    const clips = manifest.clips.filter((clip) =>
      typeof clip.url === "string" &&
      clip.url.startsWith("/assets/football-runner/animations/"),
    );
    return loadRunnerAnimationClips(target, clips);
  } catch (error) {
    console.warn("Football Runner animation manifest could not be loaded", error);
    return [];
  }
}

export async function loadRunnerAnimationClips(
  target: THREE.Object3D,
  assets: RunnerAnimationAsset[],
): Promise<THREE.AnimationClip[]> {
  const loader = createLoader();
  const retargeted: THREE.AnimationClip[] = [];

  for (const asset of assets) {
    try {
      const response = await fetch(asset.url, { cache: "force-cache" });
      if (!response.ok) {
        console.warn(`Runner animation asset unavailable: ${asset.url} (${response.status})`);
        continue;
      }
      const downloaded = await response.arrayBuffer();
      const allowed = asset.includeAnimations
        ? new Set(asset.includeAnimations.map((name) => name.toLowerCase()))
        : undefined;

      if (asset.format === "canonical-json") {
        const json = JSON.parse(new TextDecoder().decode(downloaded));
        const sourceClip = parseClipJSON(json, asset.name || "runner-motion");
        const result = retargetClipToObject(sourceClip, target);
        const requiredBones = [
          "Hips", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg",
          "LeftArm", "RightArm", "LeftForeArm", "RightForeArm",
        ];
        const trackNames = new Set(result.clip?.tracks.map((track) => track.name.split(".")[0]) ?? []);
        const missing = requiredBones.filter((bone) => !trackNames.has(bone));
        if (!result.clip || result.coverage < MIN_COVERAGE || missing.length > 0) {
          console.warn("Rejected an incomplete canonical runner animation", {
            clip: sourceClip.name,
            coverage: result.coverage,
            matched: result.matched,
            total: result.total,
            missing,
          });
          continue;
        }
        result.clip.name = asset.name || sourceClip.name || "runner-motion";
        retargeted.push(result.clip);
        console.info("Loaded canonical runner animation", {
          clip: result.clip.name,
          coverage: result.coverage,
          matched: result.matched,
          total: result.total,
          tracks: result.clip.tracks.length,
        });
        continue;
      }

      const raw = asset.compression === "gzip"
        ? await decompressAnimationAsset(downloaded)
        : downloaded;
      const { buffer } = canonicalizeGLBBones(raw);
      const source = await loader.parseAsync(buffer, new URL(".", window.location.href).href);

      for (const sourceClip of source.animations) {
        if (allowed && !allowed.has(sourceClip.name.toLowerCase())) continue;
        const result = retargetClipToObject(sourceClip, target);
        if (!result.clip || result.coverage < MIN_COVERAGE) {
          console.warn("Skipped a low-coverage runner animation", {
            clip: sourceClip.name,
            coverage: result.coverage,
          });
          continue;
        }
        result.clip.name = sourceClip.name || asset.name || "runner-motion";
        retargeted.push(result.clip);
      }
      disposeRunnerCharacterModel(source.scene);
    } catch (error) {
      console.warn(`Could not retarget runner animation asset: ${asset.url}`, error);
    }
  }

  return retargeted;
}

export function disposeRunnerCharacterModel(model: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const surfaces = Array.isArray(object.material) ? object.material : [object.material];
    surfaces.forEach((surface) => {
      materials.add(surface);
      Object.values(surface).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
