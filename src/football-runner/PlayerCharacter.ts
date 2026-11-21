import * as THREE from "three";
import { RUNNER_CONFIG } from "./config";

export type PlayerCharacter = {
  root: THREE.Group;
  torso: THREE.Group;
  pelvis: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftThigh: THREE.Group;
  rightThigh: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
};

const standard = (color: number, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function capsuleBetween(radius: number, length: number, material: THREE.Material, segments = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, segments), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addMesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createPlayerCharacter(): PlayerCharacter {
  const root = new THREE.Group();
  root.name = "sethis-footballer";
  root.position.set(0, 0, RUNNER_CONFIG.playerStartZ);
  root.scale.setScalar(1.06);

  const kit = standard(RUNNER_CONFIG.colors.coral, 0.68);
  const kitDark = standard(0x9e514e, 0.74);
  const shortsMat = standard(0x252233, 0.84);
  const skin = standard(0x9b674f, 0.88);
  const skinLight = standard(0xb77e61, 0.86);
  const sock = standard(0xf2edf0, 0.82);
  const sockAccent = standard(0xe98272, 0.76);
  const boot = standard(0x17141e, 0.52, 0.12);
  const bootAccent = standard(0xe98272, 0.52, 0.08);
  const hair = standard(0x211b20, 0.94);
  const trim = standard(0xf5d9d4, 0.76);
  const numberMat = standard(0x3a2430, 0.76);

  // Pelvis and shorts form a clear football-kit silhouette.
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.98;
  root.add(pelvis);
  addMesh(pelvis, new THREE.CapsuleGeometry(0.29, 0.25, 4, 10), shortsMat, [0, 0, 0]);
  addMesh(pelvis, new THREE.BoxGeometry(0.58, 0.16, 0.32), shortsMat, [0, 0.11, 0]);
  for (const side of [-1, 1]) {
    const stripe = addMesh(pelvis, new THREE.BoxGeometry(0.035, 0.27, 0.012), kit, [side * 0.245, 0, 0.166]);
    stripe.material = kit;
  }

  // Torso: athletic chest, shoulders, collar and visible kit detailing.
  const torso = new THREE.Group();
  torso.position.set(0, 1.52, 0);
  root.add(torso);
  const chest = addMesh(torso, new THREE.CapsuleGeometry(0.31, 0.55, 6, 14), kit, [0, 0.02, 0]);
  chest.scale.set(1.16, 1.04, 0.84);
  // Rounded shoulder and upper-back volume gives the kit a recognisable athletic silhouette.
  for (const side of [-1, 1]) {
    const shoulderMass = addMesh(torso, new THREE.SphereGeometry(0.19, 14, 12), kit, [side * 0.285, 0.27, 0]);
    shoulderMass.scale.set(1.12, 0.78, 1.04);
  }
  addMesh(torso, new THREE.CylinderGeometry(0.105, 0.12, 0.13, 12), skin, [0, 0.48, 0]);
  addMesh(torso, new THREE.TorusGeometry(0.13, 0.025, 6, 18), trim, [0, 0.45, 0]).rotation.x = Math.PI / 2;

  // Narrow side piping and rear shirt number are legible from the chase camera.
  for (const side of [-1, 1]) {
    const piping = addMesh(torso, new THREE.BoxGeometry(0.035, 0.55, 0.012), kitDark, [side * 0.28, 0.02, 0.02]);
    piping.rotation.z = side * -0.08;
    addMesh(torso, new THREE.BoxGeometry(0.13, 0.035, 0.018), trim, [side * 0.29, 0.23, 0.01]);
  }
  // A bold, geometric number 9 on the back of the shirt (camera-facing side).
  const numberZ = 0.226;
  addMesh(torso, new THREE.BoxGeometry(0.15, 0.035, 0.012), numberMat, [0, 0.08, numberZ]);
  addMesh(torso, new THREE.BoxGeometry(0.035, 0.17, 0.012), numberMat, [0.057, -0.005, numberZ]);
  addMesh(torso, new THREE.BoxGeometry(0.15, 0.035, 0.012), numberMat, [0, -0.09, numberZ]);
  addMesh(torso, new THREE.BoxGeometry(0.035, 0.12, 0.012), numberMat, [-0.057, -0.045, numberZ]);

  // Head and close-cropped hair. The face is oriented towards the run direction (-Z).
  const head = new THREE.Group();
  head.position.set(0, 2.16, -0.005);
  root.add(head);
  addMesh(head, new THREE.SphereGeometry(0.205, 18, 14), skin, [0, 0, 0]);
  const hairCap = addMesh(head, new THREE.SphereGeometry(0.211, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.53), hair, [0, 0.035, 0.005]);
  hairCap.scale.set(1.02, 1.05, 1.02);
  for (const side of [-1, 1]) {
    addMesh(head, new THREE.SphereGeometry(0.027, 8, 8), skinLight, [side * 0.205, -0.035, 0.005]);
    addMesh(head, new THREE.SphereGeometry(0.018, 8, 8), hair, [side * 0.075, 0.018, -0.188]);
  }

  // Articulated shoulders and elbows allow a natural counter-swing while running.
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.425, 1.81, 0);
    root.add(shoulder);
    const sleeve = capsuleBetween(0.125, 0.2, kit, 10);
    sleeve.position.y = -0.11;
    sleeve.rotation.z = side * -0.12;
    shoulder.add(sleeve);
    const upper = capsuleBetween(0.092, 0.34, skin, 10);
    upper.position.y = -0.39;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.56;
    shoulder.add(elbow);
    const forearm = capsuleBetween(0.082, 0.34, skinLight, 10);
    forearm.position.y = -0.2;
    elbow.add(forearm);
    const hand = addMesh(elbow, new THREE.SphereGeometry(0.085, 10, 8), skin, [0, -0.43, -0.005]);
    hand.scale.set(0.82, 1.12, 0.72);
    return { shoulder, elbow };
  };
  const leftArmParts = makeArm(-1);
  const rightArmParts = makeArm(1);

  // Two-piece legs with knees, socks and football boots. Pivots sit at the joints.
  const makeLeg = (side: -1 | 1) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * 0.19, 0.91, 0);
    root.add(thigh);
    const upper = capsuleBetween(0.145, 0.39, shortsMat, 12);
    upper.position.y = -0.22;
    thigh.add(upper);

    const knee = new THREE.Group();
    knee.position.y = -0.43;
    thigh.add(knee);
    addMesh(knee, new THREE.SphereGeometry(0.115, 12, 10), skin, [0, 0, 0]);
    const shin = capsuleBetween(0.096, 0.41, sock, 12);
    shin.position.y = -0.25;
    knee.add(shin);
    const sockBand = addMesh(knee, new THREE.CylinderGeometry(0.098, 0.098, 0.075, 12), sockAccent, [0, -0.12, 0]);
    sockBand.rotation.z = 0;
    const foot = new THREE.Group();
    foot.position.set(0, -0.49, -0.01);
    knee.add(foot);
    const bootBody = addMesh(foot, new THREE.BoxGeometry(0.17, 0.12, 0.34), boot, [0, -0.025, -0.105]);
    bootBody.rotation.x = -0.06;
    addMesh(foot, new THREE.BoxGeometry(0.13, 0.035, 0.18), bootAccent, [0, 0.04, -0.16]);
    addMesh(foot, new THREE.BoxGeometry(0.18, 0.025, 0.32), standard(0x08070d, 0.55), [0, -0.087, -0.105]);
    for (let stud = 0; stud < 3; stud++) {
      addMesh(foot, new THREE.CylinderGeometry(0.018, 0.018, 0.035, 6), bootAccent, [(stud - 1) * 0.055, -0.105, -0.2]);
    }
    return { thigh, knee, foot };
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  // Small shoulder seams and jersey sleeve cuffs make the kit read as a real uniform.
  for (const side of [-1, 1]) {
    const shoulderMark = addMesh(torso, new THREE.BoxGeometry(0.17, 0.035, 0.19), trim, [side * 0.25, 0.32, 0]);
    shoulderMark.rotation.z = side * -0.12;
  }

  return {
    root,
    torso,
    pelvis,
    head,
    leftArm: leftArmParts.shoulder,
    rightArm: rightArmParts.shoulder,
    leftForearm: leftArmParts.elbow,
    rightForearm: rightArmParts.elbow,
    leftThigh: leftLeg.thigh,
    rightThigh: rightLeg.thigh,
    leftKnee: leftLeg.knee,
    rightKnee: rightLeg.knee,
    leftFoot: leftLeg.foot,
    rightFoot: rightLeg.foot,
  };
}
