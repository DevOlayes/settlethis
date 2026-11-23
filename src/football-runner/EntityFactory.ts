import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";

const material = (color: number, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

let suppliedObstacleTemplates: THREE.Group[] = [];

export function setRunnerObstacleTemplates(templates: THREE.Group[]): void {
  suppliedObstacleTemplates = templates;
}

function addMesh(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  surface: THREE.Material,
  position: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(...position);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function createCollectible(): THREE.Group {
  const group = new THREE.Group();
  group.name = "sethis-football-collectible";
  const ballRadius = 0.235;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf6f0e9, roughness: 0.48, emissive: RUNNER_CONFIG.colors.coral, emissiveIntensity: 0.045 }));
  ball.castShadow = false;
  ball.receiveShadow = false;
  group.add(ball);
  // One instanced panel mesh replaces twelve separate panel draw calls.
  const panelGeometry = new THREE.CircleGeometry(0.066, 5);
  const panelMaterial = material(0x292431, 0.66);
  const panels = new THREE.InstancedMesh(panelGeometry, panelMaterial, 12);
  const dummy = new THREE.Object3D();
  const normals: THREE.Vector3[] = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)];
  for (let ring = 0; ring < 2; ring++) {
    const polar = ring === 0 ? 0.88 : Math.PI - 0.88;
    const phase = ring * Math.PI / 5;
    for (let index = 0; index < 5; index++) {
      const angle = (index / 5) * Math.PI * 2 + phase;
      normals.push(new THREE.Vector3(Math.sin(polar) * Math.cos(angle), Math.cos(polar), Math.sin(polar) * Math.sin(angle)).normalize());
    }
  }
  normals.forEach((normal, index) => {
    dummy.position.copy(normal).multiplyScalar(ballRadius + 0.002);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    dummy.updateMatrix();
    panels.setMatrixAt(index, dummy.matrix);
  });
  panels.instanceMatrix.needsUpdate = true;
  panels.castShadow = false;
  panels.receiveShadow = false;
  group.add(panels);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 8), new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.colors.coral, transparent: true, opacity: 0.1, depthWrite: false }));
  group.add(aura);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 5, 18), new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.colors.coral, transparent: true, opacity: 0.78 }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = -0.28;
  group.add(halo);
  group.userData.kind = "ball";
  group.userData.poolKey = "collectible";
  group.userData.hitbox = { halfWidth: 0.38, halfDepth: 0.38, height: 0.55 };
  return group;
}
export function createCollectionEffect(): THREE.Group {
  const group = new THREE.Group();
  group.name = "football-collection-burst";
  const coral = new THREE.MeshBasicMaterial({ color: RUNNER_CONFIG.colors.coral, transparent: true, opacity: 0.95, depthWrite: false });
  const warm = new THREE.MeshBasicMaterial({ color: 0xffe6d9, transparent: true, opacity: 0.95, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 7, 28), coral);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 6, 24), warm);
  innerRing.rotation.x = Math.PI / 2;
  group.add(innerRing);

  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2;
    const particle = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), index % 2 ? coral : warm);
    particle.userData.direction = new THREE.Vector3(Math.cos(angle), 0.38 + (index % 3) * 0.12, Math.sin(angle));
    group.add(particle);
  }
  group.userData.poolKey = "collection-effect";
  return group;
}

export function animateCollectionEffect(group: THREE.Group, progress: number): void {
  const eased = 1 - Math.pow(1 - progress, 2);
  const ring = group.children[0] as THREE.Mesh;
  const innerRing = group.children[1] as THREE.Mesh;
  ring.scale.setScalar(0.45 + eased * 2.1);
  innerRing.scale.setScalar(0.5 + eased * 1.55);
  ring.rotation.z = progress * 1.4;
  innerRing.rotation.z = -progress * 1.8;

  for (const particle of group.children.slice(2) as THREE.Mesh[]) {
    const direction = particle.userData.direction as THREE.Vector3;
    particle.position.copy(direction).multiplyScalar(0.12 + eased * 0.7);
    particle.scale.setScalar(1 - progress * 0.72);
    particle.rotation.set(progress * 5, progress * 7, progress * 4);
  }
  for (const child of [ring, innerRing, ...group.children.slice(2) as THREE.Mesh[]]) {
    const surface = child.material as THREE.MeshBasicMaterial;
    surface.opacity = Math.max(0, 1 - progress);
  }
}

export function createObstacle(type: number): THREE.Group {
  const group = new THREE.Group();
  const variant = ((type % 5) + 5) % 5;
  const supplied = suppliedObstacleTemplates[variant];
  if (supplied) {
    const obstacleNames = ["training-cone", "training-hurdle", "free-kick-mannequin", "passing-gate", "slalom-pole"];
    const hitboxes = [
      { halfWidth: 0.36, halfDepth: 0.36, height: 0.74, clearance: "jump" as const, clearanceHeight: 0.9 },
      { halfWidth: 0.78, halfDepth: 0.34, height: 0.88, clearance: "jump" as const, clearanceHeight: 1.08 },
      { halfWidth: 0.42, halfDepth: 0.25, height: 1.82, clearance: "jump" as const, clearanceHeight: 1.98 },
      { halfWidth: 0.76, halfDepth: 0.2, height: 1.22, clearance: "jump" as const, clearanceHeight: 1.38 },
      { halfWidth: 0.2, halfDepth: 0.2, height: 1.68, clearance: "jump" as const, clearanceHeight: 1.84 },
    ];
    group.name = `supplied-${obstacleNames[variant]}`;
    group.add(supplied.clone(true));
    group.userData.obstacleType = obstacleNames[variant];
    group.userData.hitbox = hitboxes[variant];
    group.userData.kind = "obstacle";
    group.userData.poolKey = `obstacle-${variant}`;
    return group;
  }
  const coral = material(RUNNER_CONFIG.colors.coral, 0.8);
  const dark = material(0x242337, 0.82);
  const metal = material(0x8d8795, 0.48, 0.5);
  const pale = material(0xd7d1db, 0.78);
  const grey = material(0x81778c, 0.84);
  if (variant === 0) {
    const cone = addMesh(group, new THREE.ConeGeometry(0.34, 0.78, 8), coral, [0, 0.39, 0]);
    cone.castShadow = true;
    addMesh(group, new THREE.CylinderGeometry(0.38, 0.38, 0.1, 8), dark, [0, 0.05, 0]);
    group.userData.obstacleType = "cone";
    group.userData.hitbox = { halfWidth: 0.4, halfDepth: 0.38, height: 0.82, clearance: "jump", clearanceHeight: 0.98 };
  } else if (variant === 1) {
    addMesh(group, new THREE.BoxGeometry(1.25, 0.13, 0.17), pale, [0, 0.7, 0]);
    for (const x of [-0.52, 0.52]) {
      addMesh(group, new THREE.BoxGeometry(0.12, 0.7, 0.15), coral, [x, 0.35, 0]);
      addMesh(group, new THREE.BoxGeometry(0.3, 0.07, 0.25), dark, [x, 0.035, 0]);
    }
    group.userData.obstacleType = "hurdle";
    group.userData.hitbox = { halfWidth: 0.68, halfDepth: 0.23, height: 0.78, clearance: "jump", clearanceHeight: 0.96 };
  } else if (variant === 2) {
    addMesh(group, new THREE.CapsuleGeometry(0.22, 0.9, 3, 7), grey, [0, 1.05, 0]);
    addMesh(group, new THREE.SphereGeometry(0.23, 10, 8), material(0x9a91a1), [0, 1.68, 0]);
    addMesh(group, new THREE.BoxGeometry(0.82, 0.16, 0.2), grey, [0, 1.52, 0]);
    group.userData.obstacleType = "mannequin";
    group.userData.hitbox = { halfWidth: 0.48, halfDepth: 0.38, height: 1.98, clearance: "none" };
  } else if (variant === 3) {
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
