import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";

const material = (color: number, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addMesh(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  surface: THREE.Material,
  position: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createCollectible(): THREE.Group {
  const group = new THREE.Group();
  const core = addMesh(group, new THREE.SphereGeometry(0.24, 16, 12), material(0xf6eee6, 0.58), [0, 0, 0]);
  core.castShadow = true;
  const patchMaterial = material(0x282332, 0.7);
  for (let index = 0; index < 5; index++) {
    const patch = addMesh(
      group,
      new THREE.CircleGeometry(0.07, 5),
      patchMaterial,
      [Math.cos(index * 1.256) * 0.17, Math.sin(index * 1.256) * 0.17, 0.19],
    );
    patch.rotation.y = 0;
  }
  const glow = new THREE.PointLight(RUNNER_CONFIG.colors.coral, 1.5, 3.2);
  glow.position.set(0, 0.25, 0);
  group.add(glow);
  group.userData.kind = "ball";
  group.userData.poolKey = "collectible";
  group.userData.hitbox = { halfWidth: 0.38, halfDepth: 0.38, height: 0.55 };
  return group;
}

export function createObstacle(type: number): THREE.Group {
  const group = new THREE.Group();
  const coral = material(RUNNER_CONFIG.colors.coral, 0.8);
  const dark = material(0x242337, 0.82);
  const metal = material(0x8d8795, 0.48, 0.5);
  const pale = material(0xd7d1db, 0.78);
  const grey = material(0x81778c, 0.84);
  const variant = ((type % 5) + 5) % 5;

  if (variant === 0) {
    // A low training cone: collision can be avoided by jumping over it.
    const cone = addMesh(group, new THREE.ConeGeometry(0.34, 0.78, 8), coral, [0, 0.39, 0]);
    cone.castShadow = true;
    addMesh(group, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 8), dark, [0, 0.05, 0]);
    group.userData.obstacleType = "cone";
    group.userData.hitbox = { halfWidth: 0.4, halfDepth: 0.38, height: 0.82, clearance: "jump", clearanceHeight: 0.98 };
  } else if (variant === 1) {
    // A regulation-style agility hurdle: jump over the crossbar.
    addMesh(group, new THREE.BoxGeometry(1.25, 0.13, 0.17), pale, [0, 0.7, 0]);
    for (const x of [-0.52, 0.52]) {
      addMesh(group, new THREE.BoxGeometry(0.12, 0.7, 0.15), coral, [x, 0.35, 0]);
      addMesh(group, new THREE.BoxGeometry(0.3, 0.07, 0.25), dark, [x, 0.035, 0]);
    }
    group.userData.obstacleType = "hurdle";
    group.userData.hitbox = { halfWidth: 0.68, halfDepth: 0.23, height: 0.78, clearance: "jump", clearanceHeight: 0.96 };
  } else if (variant === 2) {
    // Full-height mannequin: it must be avoided by changing lanes.
    addMesh(group, new THREE.CapsuleGeometry(0.22, 0.9, 3, 7), grey, [0, 1.05, 0]);
    addMesh(group, new THREE.SphereGeometry(0.23, 10, 8), material(0x9a91a1), [0, 1.68, 0]);
    addMesh(group, new THREE.BoxGeometry(0.82, 0.16, 0.2), grey, [0, 1.52, 0]);
    group.userData.obstacleType = "mannequin";
    group.userData.hitbox = { halfWidth: 0.48, halfDepth: 0.38, height: 1.98, clearance: "none" };
  } else if (variant === 3) {
    // Wheeled equipment cart, with a visible frame and stacked training gear.
    addMesh(group, new THREE.BoxGeometry(1.22, 0.72, 0.72), dark, [0, 0.62, 0]);
    addMesh(group, new THREE.BoxGeometry(1.08, 0.12, 0.66), metal, [0, 1.02, 0]);
    for (const x of [-0.48, 0.48]) {
      for (const z of [-0.27, 0.27]) {
        const wheel = addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.09, 10), coral, [x, 0.16, z]);
        wheel.rotation.z = Math.PI / 2;
      }
      addMesh(group, new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), metal, [x, 1.42, -0.27]);
    }
    addMesh(group, new THREE.BoxGeometry(1.05, 0.12, 0.58), coral, [0, 1.84, -0.27]);
    group.userData.obstacleType = "equipment-cart";
    group.userData.hitbox = { halfWidth: 0.72, halfDepth: 0.48, height: 1.95, clearance: "none" };
  } else {
    // A padded low-clearance training bar: slide underneath it.
    for (const x of [-0.58, 0.58]) {
      addMesh(group, new THREE.BoxGeometry(0.13, 1.58, 0.16), metal, [x, 0.79, 0]);
      addMesh(group, new THREE.BoxGeometry(0.3, 0.08, 0.25), dark, [x, 0.04, 0]);
    }
    addMesh(group, new THREE.BoxGeometry(1.34, 0.2, 0.22), coral, [0, 1.52, 0]);
    group.userData.obstacleType = "low-bar";
    group.userData.hitbox = { halfWidth: 0.74, halfDepth: 0.3, height: 1.62, clearance: "slide", slideClearanceHeight: 1.16 };
  }

  group.userData.kind = "obstacle";
  group.userData.poolKey = `obstacle-${variant}`;
  return group;
}
