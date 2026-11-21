import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type LoadedRunnerCharacter = {
  model: THREE.Group;
  animations: THREE.AnimationClip[];
};

/**
 * Loads the approved, locally bundled footballer asset.
 * Keep the model in public/assets/football-runner/player.glb so it is served
 * from the same origin as the game and does not depend on a third-party CDN.
 */
export async function loadRunnerCharacter(
  url = "/assets/football-runner/player.glb",
): Promise<LoadedRunnerCharacter> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
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

  // Normalise the source asset to the runner's world scale without distorting it.
  const bounds = new THREE.Box3().setFromObject(model);
  const height = Math.max(0.01, bounds.max.y - bounds.min.y);
  const targetHeight = 2.18;
  const scale = targetHeight / height;
  model.scale.setScalar(scale);
  model.position.y = -bounds.min.y * scale;

  return { model, animations: gltf.animations };
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
