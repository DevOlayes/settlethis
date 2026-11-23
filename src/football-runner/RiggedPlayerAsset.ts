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
      const kitTextures = surface.userData?.sethisKitTextures;
      if (Array.isArray(kitTextures)) {
        kitTextures.forEach((value: unknown) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      }
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}
