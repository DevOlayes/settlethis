import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";
import type { RunnerSceneBundle } from "./types";

export function createRunnerScene(host: HTMLElement): RunnerSceneBundle {
  const { colors, camera: cameraConfig, world: worldConfig } = RUNNER_CONFIG;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.background);
  scene.fog = new THREE.Fog(colors.background, worldConfig.fogNear, worldConfig.fogFar);

  const camera = new THREE.PerspectiveCamera(
    cameraConfig.fov,
    host.clientWidth / Math.max(1, host.clientHeight),
    cameraConfig.near,
    cameraConfig.far,
  );
  camera.position.set(...cameraConfig.start);
  camera.lookAt(...cameraConfig.lookAt);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcfc8e8, 0x302438, 2));
  const keyLight = new THREE.DirectionalLight(0xffdfd1, 2.3);
  keyLight.position.set(-5, 10, 7);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const coralFill = new THREE.PointLight(colors.coral, 1.4, 24);
  coralFill.position.set(0, 3, -10);
  scene.add(coralFill);

  const world = new THREE.Group();
  scene.add(world);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, worldConfig.length),
    new THREE.MeshStandardMaterial({ color: colors.pitch, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.12, worldConfig.centreZ);
  floor.receiveShadow = true;
  world.add(floor);

  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xe9e2d7, transparent: true, opacity: 0.26 });
  for (const x of [-1.45, 1.45]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.035, worldConfig.length), laneMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, -0.1, worldConfig.centreZ);
    world.add(line);
  }

  const standMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2948, roughness: 0.9 });
  const rowMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x34243e }),
    new THREE.MeshStandardMaterial({ color: 0x46304e }),
  ];
  for (const side of [-1, 1]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(7, 5, worldConfig.length), standMaterial);
    stand.position.set(side * 13, 2.2, worldConfig.centreZ);
    world.add(stand);
    for (let row = 0; row < 12; row++) {
      const seatRow = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, worldConfig.length), rowMaterials[row % 2]);
      seatRow.position.set(side * 13, 0.3 + row * 0.36, worldConfig.centreZ);
      world.add(seatRow);
    }
  }

  const metal = new THREE.MeshStandardMaterial({ color: 0x8d8795, metalness: 0.55, roughness: 0.45 });
  const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xf7e5bd, emissive: 0x9b7746, emissiveIntensity: 1.1 });
  for (const x of [-8.5, 8.5]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 10, 8), metal);
    pole.position.set(x, 5, -34);
    world.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.45), lampMaterial);
    lamp.position.set(x, 10, -34);
    world.add(lamp);
  }

  const goal = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f0e9, metalness: 0.35, roughness: 0.4 });
  const goalPieces = [
    [-2.1, 1.1, -67, 0.12, 2.2, 0.12],
    [2.1, 1.1, -67, 0.12, 2.2, 0.12],
    [0, 2.2, -67, 4.3, 0.12, 0.12],
  ];
  for (const [x, y, z, width, height, depth] of goalPieces) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), postMaterial);
    post.position.set(x, y, z);
    goal.add(post);
  }
  world.add(goal);

  return { scene, camera, renderer, world };
}

export function resizeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  const width = host.clientWidth;
  const height = Math.max(1, host.clientHeight);
  bundle.camera.aspect = width / height;
  bundle.camera.updateProjectionMatrix();
  bundle.renderer.setSize(width, height);
}

export function disposeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  bundle.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
  bundle.renderer.dispose();
  if (bundle.renderer.domElement.parentElement === host) host.removeChild(bundle.renderer.domElement);
}
