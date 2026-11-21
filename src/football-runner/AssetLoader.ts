import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

type ProgressHandler = (loaded: number, total: number) => void;

export class RunnerAssetLoader {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<GLTF>>();

  async loadModel(url: string, onProgress?: ProgressHandler): Promise<THREE.Group> {
    let asset = this.cache.get(url);
    if (!asset) {
      asset = this.loader.loadAsync(url, (event) => {
        onProgress?.(event.loaded, event.total);
      });
      this.cache.set(url, asset);
      asset.catch(() => this.cache.delete(url));
    }
    const gltf = await asset;
    return clone(gltf.scene) as THREE.Group;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
