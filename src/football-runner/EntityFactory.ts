import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";

export function createCollectible(): THREE.Group {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf6eee6, roughness: 0.58 }),
  );
  group.add(core);
  const patchMaterial = new THREE.MeshStandardMaterial({ color: 0x282332, roughness: 0.7 });
  for (let index = 0; index < 5; index++) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.07, 5), patchMaterial);
    patch.position.set(Math.cos(index * 1.256) * 0.17, Math.sin(index * 1.256) * 0.17, 0.19);
    group.add(patch);
  }
  const glow = new THREE.PointLight(RUNNER_CONFIG.colors.coral, 1.5, 3.2);
  glow.position.set(0, 0.25, 0);
  group.add(glow);
  group.userData.kind = "ball";
  group.userData.poolKey = "collectible";
  return group;
}

export function createObstacle(type: number): THREE.Group {
  const group = new THREE.Group();
  const coral = new THREE.MeshStandardMaterial({ color: RUNNER_CONFIG.colors.coral, roughness: 0.8 });
  if (type % 3 === 0) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.8, 8), coral);
    cone.position.y = 0.4;
    group.add(cone);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x242337, roughness: 0.8 }),
    );
    base.position.y = 0.05;
    group.add(base);
    group.userData.obstacleType = "cone";
  } else if (type % 3 === 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xd7d1db, roughness: 0.8 }),
    );
    bar.position.y = 0.65;
    group.add(bar);
    for (const x of [-0.48, 0.48]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.14), coral);
      leg.position.set(x, 0.32, 0);
      group.add(leg);
    }
    group.userData.obstacleType = "hurdle";
  } else {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.9, 3, 7),
      new THREE.MeshStandardMaterial({ color: 0x81778c }),
    );
    body.position.y = 1.05;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x9a91a1 }),
    );
    head.position.y = 1.68;
    group.add(head);
    group.userData.obstacleType = "mannequin";
  }
  group.userData.kind = "obstacle";
  group.userData.poolKey = `obstacle-${type % 3}`;
  return group;
}
