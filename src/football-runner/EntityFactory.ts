import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";

export type PlayerRig = { root: THREE.Group; legs: THREE.Group[] };

export function createPlayer(): PlayerRig {
  const player = new THREE.Group();
  player.position.set(0, 0, RUNNER_CONFIG.playerStartZ);
  const skin = new THREE.MeshStandardMaterial({ color: 0x9c6549, roughness: 0.85 });
  const shirt = new THREE.MeshStandardMaterial({ color: RUNNER_CONFIG.colors.coral, roughness: 0.72 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x242337, roughness: 0.8 });
  const socks = new THREE.MeshStandardMaterial({ color: 0xf4f1ec });
  const boots = new THREE.MeshStandardMaterial({ color: 0x18151f, roughness: 0.55 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 4, 8), shirt);
  torso.position.y = 1.35;
  torso.castShadow = true;
  player.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skin);
  head.position.y = 2.12;
  head.castShadow = true;
  player.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
    new THREE.MeshStandardMaterial({ color: 0x211b20 }),
  );
  hair.position.y = 2.2;
  player.add(hair);

  const legs: THREE.Group[] = [];
  for (const x of [-0.16, 0.16]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.82, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.48, 3, 7), shorts);
    thigh.position.y = -0.1;
    leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.47, 3, 7), socks);
    shin.position.y = -0.53;
    leg.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.34), boots);
    boot.position.set(0, -0.81, -0.08);
    leg.add(boot);
    player.add(leg);
    legs.push(leg);
  }
  for (const x of [-0.42, 0.42]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.48, 3, 7), shirt);
    arm.position.set(x, 1.42, 0);
    arm.rotation.z = x > 0 ? -0.22 : 0.22;
    player.add(arm);
  }
  return { root: player, legs };
}

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
