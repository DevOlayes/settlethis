import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";
import type { RunnerSceneBundle } from "./types";

type V3 = [number, number, number];

function box(parent: THREE.Group, size: V3, position: V3, surface: THREE.Material, castShadow = true): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function groundLine(parent: THREE.Group, width: number, length: number, position: V3, surface: THREE.Material): void {
  const line = new THREE.Mesh(new THREE.PlaneGeometry(width, length), surface);
  line.rotation.x = -Math.PI / 2;
  line.position.set(...position);
  parent.add(line);
}

function addPitchMarkings(world: THREE.Group, white: THREE.Material): void {
  const y = -0.075;
  groundLine(world, 0.055, 54, [0, y, -31], white);
  groundLine(world, 21, 0.055, [0, y, -31], white);
  groundLine(world, 0.055, 54, [-10.5, y, -31], white);
  groundLine(world, 0.055, 54, [10.5, y, -31], white);
  groundLine(world, 0.055, 16, [-7.5, y, -31], white);
  groundLine(world, 0.055, 16, [7.5, y, -31], white);
  groundLine(world, 15, 0.055, [0, y, -4], white);
  groundLine(world, 15, 0.055, [0, y, -58], white);

  const circle = new THREE.Mesh(new THREE.RingGeometry(4.45, 4.51, 64), white);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, y + 0.003, -31);
  world.add(circle);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), white);
  spot.rotation.x = -Math.PI / 2;
  spot.position.set(0, y + 0.004, -31);
  world.add(spot);
}

function addGoal(world: THREE.Group, z: number, width: number, height: number, postMaterial: THREE.Material, netMaterial: THREE.Material): void {
  const goal = new THREE.Group();
  const depth = 1.6;
  for (const x of [-width / 2, width / 2]) {
    box(goal, [0.14, height, 0.14], [x, height / 2, 0], postMaterial);
    box(goal, [0.12, height, depth], [x, height / 2, -depth / 2], postMaterial);
  }
  box(goal, [width + 0.14, 0.14, 0.14], [0, height, 0], postMaterial);
  box(goal, [width + 0.1, 0.1, 0.1], [0, height, -depth], postMaterial);
  box(goal, [0.1, 0.1, depth], [-width / 2, height, -depth / 2], postMaterial);
  box(goal, [0.1, 0.1, depth], [width / 2, height, -depth / 2], postMaterial);

  const net = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), netMaterial);
  net.position.set(0, height / 2, -depth / 2);
  goal.add(net);
  goal.position.z = z;
  world.add(goal);
}

function addStadium(world: THREE.Group, materials: Record<string, THREE.Material>): void {
  const { stand, seatA, seatB, roof, metal, coral, light } = materials;
  for (const side of [-1, 1]) {
    const x = side * 14.1;
    for (let row = 0; row < 11; row++) {
      const seat = box(world, [6.7, 0.28, 48], [x, 0.48 + row * 0.34, -31], row % 2 ? seatA : seatB, false);
      seat.position.x = side * (11.2 + row * 0.28);
    }
    box(world, [7.2, 0.65, 50], [x, 0.2, -31], stand);
    box(world, [7.8, 0.32, 51], [side * 14.3, 4.45, -31], roof);
    for (let brace = 0; brace < 5; brace++) {
      box(world, [0.16, 5.5, 0.18], [side * (10.5 + brace * 1.8), 2.3, -7 - brace * 11], metal);
    }
    box(world, [0.22, 0.22, 51], [side * 10.6, 0.12, -31], coral, false);
  }

  // Floodlight masts and banks sit outside the playing corridor.
  for (const side of [-1, 1]) {
    for (const z of [-8, -51]) {
      const x = side * 19.2;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 12, 8), metal);
      mast.position.set(x, 6, z);
      mast.castShadow = true;
      world.add(mast);
      box(world, [3.4, 0.45, 0.65], [x, 12, z], light, false);
      for (let lamp = 0; lamp < 5; lamp++) {
        box(world, [0.38, 0.18, 0.18], [x - 1.2 + lamp * 0.6, 11.72, z], materials.lampGlow, false);
      }
    }
  }

  // A compact scoreboard, placed above the far stand rather than over the running line.
  box(world, [4.8, 2.4, 0.35], [0, 8.4, -53], metal);
  box(world, [4.35, 1.95, 0.08], [0, 8.42, -52.78], materials.scoreboard, false);
  box(world, [3.2, 0.09, 0.1], [0, 8.85, -52.7], coral, false);
}

function addTransitionTunnel(world: THREE.Group, z: number, materials: Record<string, THREE.Material>): void {
  const length = 8;
  for (const side of [-1, 1]) {
    box(world, [0.55, 5.2, length], [side * 5.65, 2.6, z], materials.concrete);
    box(world, [0.14, 5.2, length], [side * 5.32, 2.6, z], materials.coral, false);
  }
  box(world, [11.8, 0.7, length], [0, 5.05, z], materials.concrete);
  box(world, [9.5, 0.08, length - 1], [0, 4.68, z], materials.tunnelLight, false);
  for (const offset of [-2.6, 0, 2.6]) {
    box(world, [0.06, 0.04, 0.5], [0, 4.59, z + offset], materials.lampGlow, false);
  }
}

function addTrainingComplex(world: THREE.Group, materials: Record<string, THREE.Material>): void {
  const turf = materials.trainingTurf;
  const line = materials.marking;
  // Two adjacent practice fields, visibly beyond the runner's safe central route.
  for (const side of [-1, 1]) {
    const x = side * 14.3;
    const field = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 43), turf);
    field.rotation.x = -Math.PI / 2;
    field.position.set(x, -0.07, -87);
    world.add(field);
    for (const edge of [-4, 4]) groundLine(world, 0.045, 42, [x + edge, -0.045, -87], line);
    groundLine(world, 8, 0.045, [x, -0.045, -87], line);
    const miniGoal = new THREE.Group();
    addGoal(miniGoal, 0, 2.8, 1.8, materials.post, materials.net);
    miniGoal.position.set(x, 0, -107);
    world.add(miniGoal);

    // Training benches and equipment racks face the practice pitches.
    box(world, [3.8, 0.22, 0.65], [side * 9.2, 0.72, -78], materials.concrete);
    for (let seat = 0; seat < 4; seat++) {
      box(world, [0.12, 0.65, 0.12], [side * (7.8 + seat * 0.9), 0.35, -78], materials.metal);
    }
  }

  // Glass-fronted training pavilion on the right and a lower recovery wing on the left.
  box(world, [4.2, 5.8, 34], [12.3, 2.9, -89], materials.building);
  box(world, [4.24, 3.6, 29], [10.12, 3.05, -89], materials.glass);
  for (let window = 0; window < 8; window++) {
    box(world, [0.06, 3.3, 0.08], [10.04, 3.05, -102 + window * 3.7], materials.windowFrame, false);
  }
  box(world, [4.2, 3.8, 34], [-12.2, 1.9, -89], materials.concrete);
  for (let bay = 0; bay < 5; bay++) {
    box(world, [0.08, 1.6, 2.1], [-10.04, 2.2, -102 + bay * 6.2], materials.glass, false);
  }
  box(world, [4.5, 0.25, 35], [12.1, 5.9, -89], materials.coral, false);
  box(world, [4.5, 0.22, 35], [-12.1, 3.85, -89], materials.roof, false);
}

function addFacilities(world: THREE.Group, materials: Record<string, THREE.Material>): void {
  // The practice grounds lead into a connected players' facility and covered walkway.
  for (const side of [-1, 1]) {
    const x = side * 13.2;
    box(world, [5.4, 5.4, 19], [x, 2.7, -126], materials.building);
    box(world, [5.45, 0.3, 19.2], [x, 5.45, -126], materials.roof);
    for (let panel = 0; panel < 4; panel++) {
      box(world, [0.08, 2.4, 2.7], [side * 10.43, 2.8, -133 + panel * 4.7], materials.glass, false);
    }
    box(world, [0.2, 2.7, 2.1], [side * 10.35, 1.45, -118], materials.coral, false);
  }
  // Low illuminated canopy guides the path between the training grounds and facilities.
  box(world, [10.8, 0.32, 7], [0, 4.4, -116], materials.roof);
  for (const side of [-1, 1]) {
    box(world, [0.16, 4.2, 0.18], [side * 5.15, 2.1, -116], materials.metal);
  }
  for (const z of [-118, -121, -124]) {
    box(world, [0.6, 0.08, 0.16], [0, 4.18, z], materials.lampGlow, false);
  }
}

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd9d1e9, 0x302438, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffdfd1, 2.0);
  keyLight.position.set(-7, 13, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -24;
  keyLight.shadow.camera.right = 24;
  keyLight.shadow.camera.top = 18;
  keyLight.shadow.camera.bottom = -18;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 48;
  scene.add(keyLight);

  const coralFill = new THREE.PointLight(colors.coral, 1.1, 26);
  coralFill.position.set(0, 3.5, -13);
  scene.add(coralFill);

  const world = new THREE.Group();
  scene.add(world);

  const materials: Record<string, THREE.Material> = {
    pitch: new THREE.MeshStandardMaterial({ color: colors.pitch, roughness: 0.96 }),
    stand: new THREE.MeshStandardMaterial({ color: 0x30283b, roughness: 0.9 }),
    seatA: new THREE.MeshStandardMaterial({ color: 0x46384f, roughness: 0.84 }),
    seatB: new THREE.MeshStandardMaterial({ color: 0x59445c, roughness: 0.84 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x252334, roughness: 0.82, metalness: 0.18 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x777483, roughness: 0.48, metalness: 0.58 }),
    coral: new THREE.MeshStandardMaterial({ color: colors.coral, roughness: 0.72 }),
    light: new THREE.MeshStandardMaterial({ color: 0xd5c8b5, roughness: 0.35, emissive: 0x76634a, emissiveIntensity: 0.6 }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe5bd }),
    scoreboard: new THREE.MeshBasicMaterial({ color: 0x201d2b }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x494453, roughness: 0.9 }),
    building: new THREE.MeshStandardMaterial({ color: 0x353342, roughness: 0.78, metalness: 0.12 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x66717b, roughness: 0.22, metalness: 0.5, transparent: true, opacity: 0.62 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: 0xaaa1ad, metalness: 0.55, roughness: 0.4 }),
    tunnelLight: new THREE.MeshBasicMaterial({ color: 0xe9a18f }),
    trainingTurf: new THREE.MeshStandardMaterial({ color: 0x304a3d, roughness: 0.98 }),
    marking: new THREE.MeshBasicMaterial({ color: 0xe9e2d7, transparent: true, opacity: 0.68, side: THREE.DoubleSide }),
    post: new THREE.MeshStandardMaterial({ color: 0xf4f0e9, metalness: 0.25, roughness: 0.42 }),
    net: new THREE.MeshStandardMaterial({ color: 0xcac4cf, wireframe: true, transparent: true, opacity: 0.26 }),
  };

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, worldConfig.length),
    materials.pitch,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.12, worldConfig.centreZ);
  floor.receiveShadow = true;
  world.add(floor);

  // Subtle lane guides retain a readable route without turning the pitch into a road.
  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xe9e2d7, transparent: true, opacity: 0.2 });
  for (const x of [-RUNNER_CONFIG.laneWidth / 2, RUNNER_CONFIG.laneWidth / 2]) {
    groundLine(world, 0.035, worldConfig.length, [x, -0.095, worldConfig.centreZ], laneMaterial);
  }
  addPitchMarkings(world, materials.marking);
  addGoal(world, -54, 7.2, 2.6, materials.post, materials.net);
  addStadium(world, materials);
  addTransitionTunnel(world, -61, materials);
  addTrainingComplex(world, materials);
  addTransitionTunnel(world, -111, materials);
  addFacilities(world, materials);

  // Perimeter lamps keep the full 180m loop visually continuous at its distant seam.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 12; index++) {
      const z = 35 - index * 15;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.8, 6), materials.metal);
      post.position.set(side * 11.65, 1.9, z);
      world.add(post);
      box(world, [0.7, 0.08, 0.12], [side * 11.65, 3.85, z], materials.lampGlow, false);
    }
  }

  // A second copy trails the active 180m segment so the ground and landmarks remain underfoot while the loop advances.\n  const loopCopy = world.clone(true);\n  loopCopy.position.z = -worldConfig.length;\n  world.add(loopCopy);\n\n  return { scene, camera, renderer, world };
}

export function resizeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  const width = host.clientWidth;
  const height = Math.max(1, host.clientHeight);
  bundle.camera.aspect = width / height;
  bundle.camera.updateProjectionMatrix();
  bundle.renderer.setSize(width, height);
}

export function disposeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  bundle.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach((item) => materials.add(item));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((surface) => surface.dispose());
  bundle.renderer.dispose();
  if (bundle.renderer.domElement.parentElement === host) host.removeChild(bundle.renderer.domElement);
}
