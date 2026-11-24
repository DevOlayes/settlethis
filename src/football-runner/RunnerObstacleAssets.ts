import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const PACK_URLS = ["/assets/football-runner/obstacles-a.pack", "/assets/football-runner/obstacles-b.pack", "/assets/football-runner/obstacles-c.pack"];

type ObstacleAsset = {
  file: string;
  width: number;
  height: number;
  depth: number;
};

const OBSTACLE_ASSETS: ObstacleAsset[] = [
  { file: "training-cone.glb", width: 0.62, height: 0.74, depth: 0.62 },
  { file: "free-kick-mannequin.glb", width: 0.62, height: 1.82, depth: 0.38 },
];

let templatesPromise: Promise<THREE.Group[]> | undefined;

async function unpackAssetTar(url: string): Promise<Map<string, ArrayBuffer>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load supplied obstacle pack (${response.status})`);
  const compressed = await response.arrayBuffer();
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const tar = new Uint8Array(await new Response(stream).arrayBuffer());
  const files = new Map<string, ArrayBuffer>();
  let offset = 0;

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    const name = new TextDecoder().decode(header.subarray(0, 100)).replace(/\0.*$/, "");
    if (!name) break;
    const sizeText = new TextDecoder().decode(header.subarray(124, 136)).replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    if (!Number.isFinite(size) || size < 0 || offset + 512 + size > tar.length) {
      throw new Error("Supplied obstacle pack contains an invalid asset entry");
    }
    const bytes = tar.slice(offset + 512, offset + 512 + size);
    files.set(name, bytes.buffer);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

function parseGltf(loader: GLTFLoader, bytes: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.parse(bytes, "/", (gltf) => resolve(gltf.scene), reject);
  });
}

async function loadTemplates(): Promise<THREE.Group[]> {
  const packedFiles = await Promise.all(PACK_URLS.map((url) => unpackAssetTar(url)));
  const files = new Map<string, ArrayBuffer>(packedFiles.flatMap((entries) => [...entries.entries()]));
  const loader = new GLTFLoader();
  return Promise.all(OBSTACLE_ASSETS.map(async (asset) => {
    const bytes = files.get(asset.file);
    if (!bytes) throw new Error(`Missing supplied obstacle model: ${asset.file}`);
    const model = await parseGltf(loader, bytes);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
      throw new Error(`Supplied obstacle model has invalid dimensions: ${asset.file}`);
    }
    // Preserve the model's authored proportions. Independent XYZ scaling
    // distorted the supplied props and made their bases appear misaligned.
    const uniformScale = Math.min(asset.width / size.x, asset.height / size.y, asset.depth / size.z);
    model.scale.setScalar(uniformScale);
    model.position.set(-center.x * uniformScale, -bounds.min.y * uniformScale, -center.z * uniformScale);
    model.updateMatrixWorld(true);
    model.name = `SETHIS supplied ${asset.file}`;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return model;
  }));
}

/** Load and size the exact user-supplied football training obstacle models. */
export function loadRunnerObstacleTemplates(): Promise<THREE.Group[]> {
  if (!templatesPromise) templatesPromise = loadTemplates();
  return templatesPromise;
}
