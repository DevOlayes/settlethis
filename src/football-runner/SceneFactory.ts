import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";
import type { RunnerSceneBundle } from "./types";
import { getInitialRunnerRenderQuality } from "./RenderQuality";

type V3 = [number, number, number];

function box(parent: THREE.Group, size: V3, position: V3, surface: THREE.Material, castShadow = false): THREE.Mesh {
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

function addCrowd(world: THREE.Group): void {
  // Instanced spectator silhouettes add scale and life without thousands of draw calls.
  const bodyGeometry = new THREE.CapsuleGeometry(0.062, 0.16, 2, 6);
  const headGeometry = new THREE.SphereGeometry(0.061, 7, 6);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94 });
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 });
  const count = 2 * 11 * 26;
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, count);
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, count);
  const dummy = new THREE.Object3D();
  const palette = [0xe5e2dc, 0x7b5360, 0x51465e, 0x9b8acb, 0x8d7770, 0x6f7770, 0xe98272, 0xaaa3b5, 0x2c6fba, 0xf1f1eb, 0x2f9a62];
  let index = 0;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 11; row++) {
      for (let seat = 0; seat < 26; seat++) {
        const x = side * (11.2 + row * 0.28);
        const y = 0.78 + row * 0.34;
        const z = -8 - seat * 1.78 + (row % 2) * 0.35;
        const tone = palette[(seat * 3 + row * 5 + (side === 1 ? 2 : 0)) % palette.length];
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, ((seat + row) % 3 - 1) * 0.08);
        dummy.scale.set(1, 0.9 + ((seat + row) % 4) * 0.06, 1);
        dummy.updateMatrix();
        bodies.setMatrixAt(index, dummy.matrix);
        bodies.setColorAt(index, new THREE.Color(tone));
        dummy.position.set(x, y + 0.205, z - 0.012);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        heads.setMatrixAt(index, dummy.matrix);
        heads.setColorAt(index, new THREE.Color(0x9a7969 + ((seat % 3) * 0x080604)));
        index++;
      }
    }
  }
  bodies.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
  bodies.castShadow = false;
  bodies.receiveShadow = false;
  heads.castShadow = false;
  heads.receiveShadow = false;
  world.add(bodies, heads);
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

  addCrowd(world);

  // Low LED perimeter boards give the pitch a recognisable professional match-day edge.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 6; index++) {
      const z = 30 - index * 15;
      box(world, [0.28, 0.62, 12.5], [side * 10.85, 0.34, z], materials.adBoard, false);
      box(world, [0.3, 0.045, 12.5], [side * 10.85, 0.68, z], materials.coral, false);
    }
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
  // Keep the facility approach open above the running lanes for uninterrupted visibility.
}

export function createRunnerScene(host: HTMLElement): RunnerSceneBundle {
  const { colors, camera: cameraConfig, world: worldConfig } = RUNNER_CONFIG;
  const scene = new THREE.Scene();
  // Daylight stadium atmosphere: a clear sky and pale distance haze replace the previous dark tunnel-like mood.
  const skyBlue = new THREE.Color(0x18212c);
  scene.background = skyBlue;
  scene.fog = new THREE.Fog(0x202a35, worldConfig.fogNear + 12, worldConfig.fogFar + 32);

  const camera = new THREE.PerspectiveCamera(
    cameraConfig.fov,
    host.clientWidth / Math.max(1, host.clientHeight),
    cameraConfig.near,
    cameraConfig.far,
  );
  camera.position.set(...cameraConfig.start);
  camera.lookAt(...cameraConfig.lookAt);
  camera.updateProjectionMatrix();

  const renderQuality = getInitialRunnerRenderQuality();
  const pixelRatioCap = renderQuality === "high" ? 1.08 : renderQuality === "balanced" ? 0.88 : 0.72;
  const shadowMapSize = renderQuality === "high" ? 512 : 0;
  const renderer = new THREE.WebGLRenderer({
    antialias: renderQuality !== "low",
    alpha: false,
    powerPreference: "low-power",
  });
  // Device-aware resolution keeps the drawing buffer proportional to available hardware.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = renderQuality === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xdce8f4, 0x526047, 1.55));
  const keyLight = new THREE.DirectionalLight(0xffedcf, 2.35);
  keyLight.position.set(-8, 15, 7);
  keyLight.userData.runnerShadowLight = true;
  keyLight.castShadow = renderQuality === "high";
  if (shadowMapSize > 0) keyLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  keyLight.shadow.bias = -0.00018;
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.camera.left = -17;
  keyLight.shadow.camera.right = 17;
  keyLight.shadow.camera.top = 13;
  keyLight.shadow.camera.bottom = -13;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 48;
  scene.add(keyLight);

  // Broad fill keeps the player's kit and obstacles legible in covered sections.
  const frontFill = new THREE.DirectionalLight(0xe6edf6, 0.68);
  frontFill.position.set(7, 8, 10);
  scene.add(frontFill);
  const coolRim = new THREE.DirectionalLight(0xb4cce0, 0.2);
  coolRim.position.set(0, 8, -12);
  scene.add(coolRim);

  const coralFill = new THREE.PointLight(colors.coral, 0.28, 24);
  coralFill.position.set(0, 3.5, -13);
  scene.add(coralFill);

  const world = new THREE.Group();
  scene.add(world);
  const environmentRoot = new THREE.Group();
  environmentRoot.name = "runner-environment-root";
  // Use the original procedural grass pitch by default; the imported Club Ground
  // model is intentionally no longer loaded for the production runner.
  environmentRoot.visible = true;
  world.add(environmentRoot);

  const materials: Record<string, THREE.Material> = {
    pitch: new THREE.MeshStandardMaterial({ color: 0x3c9d43, roughness: 0.96 }),
    stand: new THREE.MeshStandardMaterial({ color: 0x596a7a, roughness: 0.9 }),
    seatA: new THREE.MeshStandardMaterial({ color: 0x657d91, roughness: 0.84 }),
    seatB: new THREE.MeshStandardMaterial({ color: 0x8297a6, roughness: 0.84 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x647b8d, roughness: 0.82, metalness: 0.12 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x777483, roughness: 0.48, metalness: 0.58 }),
    coral: new THREE.MeshStandardMaterial({ color: colors.coral, roughness: 0.72 }),
    light: new THREE.MeshStandardMaterial({ color: 0xd5c8b5, roughness: 0.35, emissive: 0x76634a, emissiveIntensity: 0.6 }),
    lampGlow: new THREE.MeshBasicMaterial({ color: 0xffe5bd }),
    scoreboard: new THREE.MeshBasicMaterial({ color: 0x201d2b }),
    adBoard: new THREE.MeshStandardMaterial({ color: 0x211d2b, roughness: 0.6, metalness: 0.22 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x9aa8ae, roughness: 0.9 }),
    building: new THREE.MeshStandardMaterial({ color: 0x7d929d, roughness: 0.78, metalness: 0.12 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x66717b, roughness: 0.22, metalness: 0.5, transparent: true, opacity: 0.62 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: 0xaaa1ad, metalness: 0.55, roughness: 0.4 }),
    tunnelLight: new THREE.MeshBasicMaterial({ color: 0xe9a18f }),
    trainingTurf: new THREE.MeshStandardMaterial({ color: 0x459d4c, roughness: 0.98 }),
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
  environmentRoot.add(floor);

  // Alternating mowing bands break up the flat green surface and add pitch depth.
  const turfBands = [
    new THREE.MeshStandardMaterial({ color: 0x43a84a, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x328b3d, roughness: 1 }),
  ];
  for (let band = 0; band < 12; band++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(24, 15), turfBands[band % 2]);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, -0.113, 34.5 - band * 15);
    stripe.receiveShadow = true;
    environmentRoot.add(stripe);
  }

  // Subtle lane guides retain a readable route without turning the pitch into a road.
  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xe9e2d7, transparent: true, opacity: 0.2 });
  for (const x of [-RUNNER_CONFIG.laneWidth / 2, RUNNER_CONFIG.laneWidth / 2]) {
    groundLine(environmentRoot, 0.035, worldConfig.length, [x, -0.095, worldConfig.centreZ], laneMaterial);
  }
  addPitchMarkings(environmentRoot, materials.marking);
  addGoal(environmentRoot, -54, 7.2, 2.6, materials.post, materials.net);
  addStadium(environmentRoot, materials);
  addTrainingComplex(environmentRoot, materials);
  addFacilities(environmentRoot, materials);

  // Perimeter lamps keep the full 180m loop visually continuous at its distant seam.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 12; index++) {
      const z = 35 - index * 15;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.8, 6), materials.metal);
      post.position.set(side * 11.65, 1.9, z);
      environmentRoot.add(post);
      box(environmentRoot, [0.7, 0.08, 0.12], [side * 11.65, 3.85, z], materials.lampGlow, false);
    }
  }

  // A matching copy keeps the original grass pitch and landmarks seamless at wrap.
  const loopCopy = environmentRoot.clone(true);
  loopCopy.name = "runner-environment-loop-copy";
  loopCopy.visible = true;
  loopCopy.position.z = -worldConfig.length;
  world.add(loopCopy);

  return { scene, camera, renderer, world, renderQuality, environmentRoot };
}

export function resizeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  const currentSize = bundle.renderer.getSize(new THREE.Vector2());
  if (currentSize.x === width && currentSize.y === height) return;
  bundle.camera.aspect = width / height;
  bundle.camera.updateProjectionMatrix();
  bundle.renderer.setSize(width, height);
}

export function disposeRunnerScene(bundle: RunnerSceneBundle, host: HTMLElement): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  bundle.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    list.forEach((surface) => {
      materials.add(surface);
      Object.values(surface).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((surface) => surface.dispose());
  textures.forEach((texture) => texture.dispose());
  bundle.renderer.dispose();
  if (bundle.renderer.domElement.parentElement === host) host.removeChild(bundle.renderer.domElement);
}

