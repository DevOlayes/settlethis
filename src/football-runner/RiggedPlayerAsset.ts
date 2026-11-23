import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { canonicalizeGLBBones, MIN_COVERAGE, retargetClipToObject } from "@three-ws/retarget";

export type LoadedRunnerCharacter = {
  model: THREE.Group;
  animations: THREE.AnimationClip[];
};

type RunnerAnimationAsset = {
  name?: string;
  url: string;
  includeAnimations?: string[];
  compression?: "gzip";
  format?: "canonical-json" | "native-biped-glb";
  source?: string;
  license?: string;
};

type RunnerAnimationManifest = {
  clips: RunnerAnimationAsset[];
};

async function decompressAnimationAsset(input: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support gzip animation asset decoding");
  }
  const compressed = new Blob([input]).stream();
  const decompressed = compressed.pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressed).arrayBuffer();
}


function createSethisChestMark(back: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create SETHIS kit lettering texture");
  context.clearRect(0, 0, 512, 512);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#E98272";
  context.font = back ? "900 252px Arial, sans-serif" : "900 164px Arial, sans-serif";
  context.fillText("10", 256, back ? 220 : 214);
  context.font = back ? "800 48px Arial, sans-serif" : "800 38px Arial, sans-serif";
  context.letterSpacing = "4px";
  context.fillText("SETHIS", 256, back ? 405 : 365);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function applySethisKit(model: THREE.Group): void {
  model.updateMatrixWorld(true);
  const bonePositions = new Map<string, THREE.Vector3>();
  const boneIndexByName = new Map<string, number>();
  let targetMesh: THREE.SkinnedMesh | undefined;

  model.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh) || targetMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name === "m300_body")) targetMesh = object;
  });
  if (!targetMesh) return;

  const mesh = targetMesh;
  mesh.skeleton.bones.forEach((bone, index) => {
    boneIndexByName.set(bone.name.toLowerCase().replace(/[^a-z0-9]/g, ""), index);
    const point = bone.getWorldPosition(new THREE.Vector3());
    model.worldToLocal(point);
    bonePositions.set(bone.name.toLowerCase().replace(/[^a-z0-9]/g, ""), point);
  });

  const findBone = (pattern: RegExp): THREE.Vector3 | undefined => {
    for (const [name, point] of bonePositions) if (pattern.test(name)) return point;
    return undefined;
  };
  const pelvis = findBone(/bip01pelvis$/);
  const spine = findBone(/bip01spine$/);
  const spine1 = findBone(/bip01spine1$/);
  const spine2 = findBone(/bip01spine2$/);
  const neck = findBone(/bip01neck$/);
  const leftClavicle = findBone(/bip01lclavicle$/);
  const rightClavicle = findBone(/bip01rclavicle$/);
  if (!pelvis || !spine || !spine1 || !spine2 || !neck || !leftClavicle || !rightClavicle) {
    console.warn("SETHIS kit treatment skipped: expected Sports Male 03 torso bones were not found");
    return;
  }

  const geometry = mesh.geometry.clone();
  const skinIndices = geometry.getAttribute("skinIndex");
  const skinWeights = geometry.getAttribute("skinWeight");
  if (!skinIndices || !skinWeights) return;
  const torsoBones = new Set<number>();
  const shoulderBones = new Set<number>();
  for (const [name, index] of boneIndexByName) {
    if (/bip01spine(?:1|2)?$/.test(name) || /bip01[lr]clavicle$/.test(name)) torsoBones.add(index);
    if (/bip01[lr](?:clavicle|upperarm)$/.test(name)) shoulderBones.add(index);
  }
  const torsoWeight = new Float32Array(geometry.getAttribute("position").count);
  const shoulderWeight = new Float32Array(geometry.getAttribute("position").count);
  for (let i = 0; i < torsoWeight.length; i++) {
    for (let influence = 0; influence < 4; influence++) {
      const index = skinIndices.getComponent(i, influence);
      const weight = skinWeights.getComponent(i, influence);
      if (torsoBones.has(index)) torsoWeight[i] += weight;
      if (shoulderBones.has(index)) shoulderWeight[i] += weight;
    }
  }
  geometry.setAttribute("sethisTorsoWeight", new THREE.BufferAttribute(torsoWeight, 1));
  geometry.setAttribute("sethisShoulderWeight", new THREE.BufferAttribute(shoulderWeight, 1));
  mesh.geometry = geometry;

  const shirtMinY = pelvis.y + (spine.y - pelvis.y) * 0.18;
  const shirtMaxY = neck.y - (neck.y - spine2.y) * 0.24;
  const chestMinY = spine1.y - 0.025;
  const chestMaxY = spine2.y + (neck.y - spine2.y) * 0.12;
  const shoulderY = (leftClavicle.y + rightClavicle.y) * 0.5;
  const shoulderHalfWidth = THREE.MathUtils.clamp(
    Math.abs(leftClavicle.x - rightClavicle.x) * 0.55,
    0.145,
    0.215,
  );
  const chestHalfWidth = shoulderHalfWidth * 0.86;
  const meshToModel = new THREE.Matrix4().copy(model.matrixWorld).invert().multiply(mesh.matrixWorld);
  const frontMark = createSethisChestMark(false);
  const backMark = createSethisChestMark(true);

  const materials = Array.isArray(mesh.material) ? [...mesh.material] : [mesh.material];
  const bodyIndex = materials.findIndex((material) => material.name === "m300_body");
  if (bodyIndex < 0 || !(materials[bodyIndex] instanceof THREE.MeshStandardMaterial)) {
    frontMark.dispose();
    backMark.dispose();
    return;
  }
  const body = (materials[bodyIndex] as THREE.MeshStandardMaterial).clone();
  body.userData.sethisKitTextures = [frontMark, backMark];
  body.onBeforeCompile = (shader) => {
    shader.uniforms.uSethisKitColor = { value: new THREE.Color("#171522") };
    shader.uniforms.uSethisCoral = { value: new THREE.Color("#E98272") };
    shader.uniforms.uSethisChestFront = { value: frontMark };
    shader.uniforms.uSethisChestBack = { value: backMark };
    shader.uniforms.uSethisMeshToModel = { value: meshToModel };
    shader.uniforms.uSethisShirtMinY = { value: shirtMinY };
    shader.uniforms.uSethisShirtMaxY = { value: shirtMaxY };
    shader.uniforms.uSethisChestMinY = { value: chestMinY };
    shader.uniforms.uSethisChestMaxY = { value: chestMaxY };
    shader.uniforms.uSethisShoulderY = { value: shoulderY };
    shader.uniforms.uSethisShoulderHalfWidth = { value: shoulderHalfWidth };
    shader.uniforms.uSethisChestHalfWidth = { value: chestHalfWidth };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        \`#include <common>
attribute float sethisTorsoWeight;
attribute float sethisShoulderWeight;
uniform mat4 uSethisMeshToModel;
varying vec3 vSethisLocalPosition;
varying float vSethisTorsoWeight;
varying float vSethisShoulderWeight;\`,
      )
      .replace(
        "#include <skinning_vertex>",
        \`#include <skinning_vertex>
vSethisLocalPosition = (uSethisMeshToModel * vec4(transformed, 1.0)).xyz;
vSethisTorsoWeight = sethisTorsoWeight;
vSethisShoulderWeight = sethisShoulderWeight;\`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        \`#include <common>
uniform vec3 uSethisKitColor;
uniform vec3 uSethisCoral;
uniform sampler2D uSethisChestFront;
uniform sampler2D uSethisChestBack;
uniform float uSethisShirtMinY;
uniform float uSethisShirtMaxY;
uniform float uSethisChestMinY;
uniform float uSethisChestMaxY;
uniform float uSethisShoulderY;
uniform float uSethisShoulderHalfWidth;
uniform float uSethisChestHalfWidth;
varying vec3 vSethisLocalPosition;
varying float vSethisTorsoWeight;
varying float vSethisShoulderWeight;\`,
      )
      .replace(
        "#include <map_fragment>",
        \`#include <map_fragment>
float sethisY = vSethisLocalPosition.y;
float sethisX = abs(vSethisLocalPosition.x);
float sethisTorsoRange = smoothstep(uSethisShirtMinY - 0.025, uSethisShirtMinY + 0.035, sethisY)
  * (1.0 - smoothstep(uSethisShirtMaxY - 0.035, uSethisShirtMaxY + 0.025, sethisY));
float sethisTorsoMask = smoothstep(0.24, 0.72, vSethisTorsoWeight) * sethisTorsoRange;
float sethisSleeveRange = smoothstep(uSethisShoulderY - 0.10, uSethisShoulderY - 0.035, sethisY)
  * (1.0 - smoothstep(uSethisShoulderY + 0.055, uSethisShoulderY + 0.13, sethisY));
float sethisSleeveMask = smoothstep(0.18, 0.68, vSethisShoulderWeight) * sethisSleeveRange;
float sethisKitMask = max(sethisTorsoMask, sethisSleeveMask);
float sethisFabricLight = 0.94 + 0.10 * dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
vec3 sethisFabric = uSethisKitColor * sethisFabricLight;
diffuseColor.rgb = mix(diffuseColor.rgb, sethisFabric, sethisKitMask);

float sethisShoulderSpan = smoothstep(uSethisShoulderHalfWidth * 0.52, uSethisShoulderHalfWidth * 0.78, sethisX)
  * (1.0 - smoothstep(uSethisShoulderHalfWidth * 1.62, uSethisShoulderHalfWidth * 1.95, sethisX));
float sethisStripeOne = 1.0 - smoothstep(0.012, 0.026, abs(sethisY - (uSethisShoulderY - 0.012)));
float sethisStripeTwo = 1.0 - smoothstep(0.010, 0.023, abs(sethisY - (uSethisShoulderY + 0.035)));
float sethisShoulderStripe = max(sethisStripeOne, sethisStripeTwo)
  * sethisShoulderSpan * sethisSleeveMask;
diffuseColor.rgb = mix(diffuseColor.rgb, uSethisCoral, sethisShoulderStripe);

vec2 sethisChestUv = vec2(
  (vSethisLocalPosition.x / (2.0 * uSethisChestHalfWidth)) + 0.5,
  (sethisY - uSethisChestMinY) / max(0.001, uSethisChestMaxY - uSethisChestMinY)
);
if (vSethisLocalPosition.z < 0.0) sethisChestUv.x = 1.0 - sethisChestUv.x;
float sethisChestRegion = sethisTorsoMask
  * smoothstep(0.025, 0.085, abs(vSethisLocalPosition.z))
  * step(0.0, sethisChestUv.x) * step(sethisChestUv.x, 1.0)
  * step(0.0, sethisChestUv.y) * step(sethisChestUv.y, 1.0);
vec4 sethisChestMark = vSethisLocalPosition.z < 0.0
  ? texture2D(uSethisChestBack, sethisChestUv)
  : texture2D(uSethisChestFront, sethisChestUv);
diffuseColor.rgb = mix(diffuseColor.rgb, sethisChestMark.rgb, sethisChestMark.a * sethisChestRegion);\`,
      );
  };
  body.customProgramCacheKey = () => "sethis-football-kit-v1";
  body.needsUpdate = true;
  materials[bodyIndex] = body;
  mesh.material = materials;
  mesh.userData.sethisKitApplied = true;
  console.info("Applied SETHIS aubergine-and-coral kit to the original skinned Sports Male 03 body", {
    shirtMinY,
    shirtMaxY,
    chestMinY,
    chestMaxY,
    shoulderY,
    chestHalfWidth,
    mesh: mesh.name,
  });
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
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load footballer asset (${response.status})`);
  const raw = await response.arrayBuffer();
  const gltf = await createLoader().parseAsync(raw, new URL(".", window.location.href).href);
  const model = gltf.scene;
  model.name = "sethis-rigged-footballer";
  console.info("Loaded original Sports Male 03 Biped hierarchy without bone renaming or reparenting.");

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
  applySethisKit(model);

  return { model, animations: gltf.animations };
}

export async function loadRunnerAnimationManifest(
  target: THREE.Object3D,
  manifestUrl = "/assets/football-runner/animations/manifest.json",
): Promise<THREE.AnimationClip[]> {
  try {
    const response = await fetch(manifestUrl, { cache: "no-cache" });
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

      if (asset.format === "native-biped-glb") {
        const source = await loader.parseAsync(downloaded, new URL(".", window.location.href).href);
        const sourceClip = source.animations.find((clip) =>
          !allowed || allowed.has(clip.name.toLowerCase()),
        );
        if (!sourceClip) {
          disposeRunnerCharacterModel(source.scene);
          throw new Error("Native Biped GLB does not contain the requested animation clip");
        }
        // Preserve the avatar's own root orientation and bind transform.
        // The source clip's root channels belong to the export coordinate
        // frame; the remaining Bip01 channels match this character directly.
        const tracks = sourceClip.tracks.filter((track) =>
          !/^Bip01(?:_| )?\.(?:position|quaternion)$/.test(track.name),
        );
        const normalize = (value: string) => value.replace(/_/g, " ").toLowerCase();
        const driven = new Set(tracks.map((track) =>
          normalize(track.name.slice(0, track.name.lastIndexOf("."))),
        ));
        const required = [
          "Bip01 Pelvis", "Bip01 L Thigh", "Bip01 R Thigh",
          "Bip01 L Calf", "Bip01 R Calf", "Bip01 L UpperArm", "Bip01 R UpperArm",
        ];
        const missing = required.filter((name) => !driven.has(normalize(name)));
        if (missing.length) {
          disposeRunnerCharacterModel(source.scene);
          throw new Error("Native Biped run is missing matching Sports Male 03 bones: " + missing.join(", "));
        }
        const nativeClip = new THREE.AnimationClip(
          asset.name || sourceClip.name || "sports-male-03-native-run",
          sourceClip.duration,
          tracks,
        );
        retargeted.push(nativeClip);
        console.info("Loaded matching native Sports Male 03 Biped run", {
          clip: nativeClip.name,
          duration: nativeClip.duration,
          tracks: tracks.length,
          excludedRootTracks: sourceClip.tracks.length - tracks.length,
        });
        disposeRunnerCharacterModel(source.scene);
        continue;
      }

      if (asset.format === "canonical-json") {
        const json = JSON.parse(new TextDecoder().decode(downloaded)) as {
          name?: string;
          duration?: number;
          tracks?: Array<{
            name: string;
            type: "vector" | "quaternion";
            times: number[];
            values: number[];
          }>;
        };
        if (!json || !Array.isArray(json.tracks) || !Number.isFinite(json.duration)) {
          throw new Error("Canonical animation JSON has an invalid structure");
        }
        // The canonical Mixamo export stores POSITION values for many
        // child bones in source/world space (for example, Spine and Neck have
        // large absolute Y coordinates). Replaying those as local bone
        // translations pulls the avatar's mesh apart. Sports Male 03 must keep
        // its own bind-pose bone offsets, so retarget rotations only.
        const rotationTracks = json.tracks.filter((track) => track.type === "quaternion");
        if (!rotationTracks.length) {
          throw new Error("Canonical animation contains no bone rotation tracks");
        }
        const sourceTracks = rotationTracks.map((track) => {
          if (!track.name || !Array.isArray(track.times) || !Array.isArray(track.values)) {
            throw new Error("Canonical animation contains an invalid rotation track");
          }
          return new THREE.QuaternionKeyframeTrack(track.name, track.times, track.values);
        });
        const sourceClip = new THREE.AnimationClip(
          json.name || asset.name || "runner-motion",
          json.duration as number,
          sourceTracks,
        );
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
