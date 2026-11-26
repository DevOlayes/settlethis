import { useEffect, useRef } from "react";
import * as THREE from "three";

function buildGift(scene: THREE.Scene) {
  const coral = new THREE.MeshPhysicalMaterial({ color: 0xe98272, roughness: 0.52, metalness: 0, clearcoat: 0.28, clearcoatRoughness: 0.38 });
  const coralLight = new THREE.MeshPhysicalMaterial({ color: 0xf39a85, roughness: 0.48, metalness: 0, clearcoat: 0.32, clearcoatRoughness: 0.35 });
  const coralSide = new THREE.MeshPhysicalMaterial({ color: 0x984e5b, roughness: 0.55, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.42 });
  const inner = new THREE.MeshStandardMaterial({ color: 0x382137, roughness: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe9bd88, metalness: 0.72, roughness: 0.24 });
  const goldLight = new THREE.MeshStandardMaterial({ color: 0xffdfb0, metalness: 0.58, roughness: 0.2 });
  const darkGold = new THREE.MeshStandardMaterial({ color: 0xb77c61, metalness: 0.55, roughness: 0.3 });
  const box = new THREE.Group();
  scene.add(box);

  const addBox = (parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Four separate walls and a real floor leave an open cavity beneath the lid.
  addBox(box, 2.48, 0.10, 2.12, coralSide, 0, 0.05, 0);
  addBox(box, 2.48, 1.88, 0.085, coral, 0, 1.02, 1.015);
  addBox(box, 2.48, 1.88, 0.085, coralSide, 0, 1.02, -1.015);
  addBox(box, 0.085, 1.88, 1.95, coralLight, -1.2075, 1.02, 0);
  addBox(box, 0.085, 1.88, 1.95, coralSide, 1.2075, 1.02, 0);
  // Inner lining and inset base.
  addBox(box, 2.24, 0.045, 1.86, inner, 0, 0.19, 0);
  addBox(box, 2.27, 1.7, 0.035, inner, 0, 1.04, 0.91);
  addBox(box, 2.27, 1.7, 0.035, inner, 0, 1.04, -0.91);
  addBox(box, 0.035, 1.7, 1.75, inner, -1.09, 1.04, 0);
  addBox(box, 0.035, 1.7, 1.75, inner, 1.09, 1.04, 0);

  // Satin bands wrap the body continuously across the front and visible right face.
  addBox(box, 0.22, 1.9, 0.022, goldLight, 0, 1.04, 1.066);
  addBox(box, 0.022, 1.9, 0.22, gold, 1.255, 1.04, 0);

  // The lid is a single hinged assembly. Its pivot sits exactly on the back upper edge.
  const lid = new THREE.Group();
  lid.position.set(0, 1.98, -1.055);
  box.add(lid);
  addBox(lid, 2.66, 0.12, 2.26, coralLight, 0, 0.06, 1.055);
  addBox(lid, 2.66, 0.27, 0.085, coral, 0, -0.075, 2.145);
  addBox(lid, 2.66, 0.27, 0.085, coralSide, 0, -0.075, -0.035);
  addBox(lid, 0.085, 0.27, 2.10, coralLight, -1.2875, -0.075, 1.055);
  addBox(lid, 0.085, 0.27, 2.10, coralSide, 1.2875, -0.075, 1.055);
  // Ribbon crosses both axes of the lid top and continues down the skirt.
  addBox(lid, 2.67, 0.018, 0.22, goldLight, 0, 0.129, 1.055);
  addBox(lid, 0.22, 0.018, 2.26, gold, 0, 0.13, 1.055);
  addBox(lid, 0.22, 0.27, 0.022, goldLight, 0, -0.075, 2.19);
  addBox(lid, 0.022, 0.27, 0.22, gold, 1.33, -0.075, 1.055);

  // Bow loops are curved satin tubes with a fine highlight, not flat oval stickers.
  const bow = new THREE.Group();
  bow.position.set(0, 0.17, 1.055);
  lid.add(bow);
  const makeLoop = (side: number) => {
    const pts = [
      new THREE.Vector3(0, 0, 0.08),
      new THREE.Vector3(side * 0.28, 0.34, 0.1),
      new THREE.Vector3(side * 0.77, 0.48, 0.04),
      new THREE.Vector3(side * 1.03, 0.28, 0.02),
      new THREE.Vector3(side * 0.86, 0.06, 0.08),
      new THREE.Vector3(side * 0.36, 0.02, 0.13),
      new THREE.Vector3(0, 0, 0.08)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.45);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.075, 12, false), gold);
    tube.castShadow = true;
    bow.add(tube);
    const shineCurve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y + 0.018, p.z + 0.025)), false, "catmullrom", 0.45);
    bow.add(new THREE.Mesh(new THREE.TubeGeometry(shineCurve, 64, 0.014, 8, false), goldLight));
  };
  makeLoop(-1);
  makeLoop(1);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 18), goldLight);
  knot.scale.set(1.18, 0.8, 0.72);
  knot.position.set(0, 0.015, 0.17);
  knot.castShadow = true;
  bow.add(knot);
  // Two broad tails lie over the lid, then curl over its front edge.
  const tailLeft = addBox(bow, 0.32, 0.035, 0.84, gold, -0.34, -0.08, 0.56);
  tailLeft.rotation.x = -0.12;
  const tailRight = addBox(bow, 0.32, 0.035, 0.84, goldLight, 0.34, -0.08, 0.56);
  tailRight.rotation.x = -0.12;
  const hangingLeft = addBox(bow, 0.32, 0.035, 0.58, gold, -0.34, -0.32, 1.03);
  hangingLeft.rotation.x = -0.28;
  const hangingRight = addBox(bow, 0.32, 0.035, 0.58, goldLight, 0.34, -0.32, 1.03);
  hangingRight.rotation.x = -0.28;

  // A substantial, dimensional welcome medallion rises from the box.
  // Its beveled metal edge, layered face, raised rings and embossed-style lettering
  // make the 3,500 GT reward itself the hero rather than a flat floating label.
  const reward = new THREE.Group();
  reward.position.set(0, 0.18, 0);
  reward.scale.setScalar(1.12);
  reward.rotation.x = -0.12;
  box.add(reward);

  const coinEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.76, 0.17, 96, 1, false),
    new THREE.MeshPhysicalMaterial({ color: 0xd98b65, metalness: 0.82, roughness: 0.22, clearcoat: 0.8 })
  );
  coinEdge.rotation.x = Math.PI / 2;
  coinEdge.castShadow = true;
  coinEdge.receiveShadow = true;
  reward.add(coinEdge);

  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = 1024;
  faceCanvas.height = 1024;
  const faceCtx = faceCanvas.getContext("2d");
  if (faceCtx) {
    const grad = faceCtx.createRadialGradient(340, 270, 70, 512, 512, 590);
    grad.addColorStop(0, "#694553");
    grad.addColorStop(0.58, "#493541");
    grad.addColorStop(1, "#211f2c");
    faceCtx.fillStyle = grad;
    faceCtx.fillRect(0, 0, 1024, 1024);
    faceCtx.strokeStyle = "rgba(246,195,157,.88)";
    faceCtx.lineWidth = 13;
    faceCtx.beginPath(); faceCtx.arc(512, 512, 474, 0, Math.PI * 2); faceCtx.stroke();
    faceCtx.strokeStyle = "rgba(246,195,157,.38)";
    faceCtx.lineWidth = 4;
    faceCtx.beginPath(); faceCtx.arc(512, 512, 438, 0, Math.PI * 2); faceCtx.stroke();
    faceCtx.strokeStyle = "rgba(233,130,114,.35)";
    faceCtx.lineWidth = 2;
    faceCtx.beginPath(); faceCtx.arc(512, 512, 395, 0, Math.PI * 2); faceCtx.stroke();
    // Subtle wallet-style diagonal guilloche pattern.
    faceCtx.save();
    faceCtx.beginPath(); faceCtx.arc(512, 512, 385, 0, Math.PI * 2); faceCtx.clip();
    faceCtx.strokeStyle = "rgba(255,225,205,.075)";
    faceCtx.lineWidth = 3;
    for (let x = -500; x < 1500; x += 46) {
      faceCtx.beginPath(); faceCtx.moveTo(x, 80); faceCtx.lineTo(x + 760, 940); faceCtx.stroke();
    }
    faceCtx.restore();
    faceCtx.textAlign = "center";
    faceCtx.textBaseline = "middle";
    faceCtx.shadowColor = "#f6c39d";
    faceCtx.shadowBlur = 34;
    faceCtx.fillStyle = "#fff0dc";
    faceCtx.font = "900 190px Arial";
    faceCtx.fillText("3,500", 512, 450);
    faceCtx.shadowBlur = 22;
    faceCtx.fillStyle = "#f6c39d";
    faceCtx.font = "900 112px Arial";
    faceCtx.letterSpacing = "18px";
    faceCtx.fillText("GT", 512, 625);
    faceCtx.shadowBlur = 0;
    faceCtx.fillStyle = "rgba(246,195,157,.86)";
    faceCtx.font = "700 30px Arial";
    faceCtx.letterSpacing = "12px";
    faceCtx.fillText("WELCOME BONUS", 512, 760);
    // Fine ornamental dots at the cardinal points.
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const x = 512 + Math.cos(angle) * 420;
      const y = 512 + Math.sin(angle) * 420;
      faceCtx.beginPath(); faceCtx.arc(x, y, 12, 0, Math.PI * 2);
      faceCtx.fillStyle = "#f6c39d"; faceCtx.fill();
    }
  }
  const faceTexture = new THREE.CanvasTexture(faceCanvas);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  const coinFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.705, 96),
    new THREE.MeshPhysicalMaterial({ map: faceTexture, metalness: 0.28, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.16 })
  );
  coinFace.position.z = 0.092;
  reward.add(coinFace);

  const outerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.026, 12, 96),
    new THREE.MeshStandardMaterial({ color: 0xffdfb0, metalness: 0.82, roughness: 0.2 })
  );
  outerRim.position.z = 0.105;
  reward.add(outerRim);
  const innerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.009, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0xf6c39d, metalness: 0.72, roughness: 0.25 })
  );
  innerRim.position.z = 0.108;
  reward.add(innerRim);

  // A restrained orbit halo and raised studs give the medallion a premium 3D silhouette.
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.91, 0.012, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xf6c39d, transparent: true, opacity: 0.68 })
  );
  halo.position.z = -0.02;
  halo.rotation.y = 0.16;
  reward.add(halo);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.027, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffe4c6, metalness: 0.7, roughness: 0.2 })
    );
    stud.position.set(Math.cos(angle) * 0.67, Math.sin(angle) * 0.67, 0.115);
    reward.add(stud);
  }

  const glow = new THREE.PointLight(0xffc58f, 0, 5.5);
  glow.position.set(0, 2.2, 0);
  scene.add(glow);
  const lidOpenTarget = -1.72;

  return { lid, reward, glow, lidOpenTarget, dispose: () => {
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose());
      }
    });
  }};
}

export default function GiftBox3D({ opened = false, className = "" }: { opened?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openedRef = useRef(opened);

  useEffect(() => { openedRef.current = opened; }, [opened]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      canvas.dataset.fallback = "true";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4.35, 3.55, 5.6);
    camera.lookAt(0, 1.45, 0);
    scene.add(new THREE.HemisphereLight(0xffe4d2, 0x24142d, 2.0));
    const key = new THREE.DirectionalLight(0xffd6b4, 3.1);
    key.position.set(-3.5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -4;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb9a5ff, 1.5);
    rim.position.set(4, 4, -4);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.28 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.015; floor.receiveShadow = true;
    scene.add(floor);

    const gift = buildGift(scene);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0; let last = 0;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((time - (last || time)) / 1000, 0.04); last = time;
      const target = openedRef.current ? 1 : 0;
      const easing = 1 - Math.exp(-dt * (reducedMotion ? 40 : 3.1));
      gift.lid.rotation.x += ((target ? gift.lidOpenTarget : 0) - gift.lid.rotation.x) * easing;
      const rewardY = target ? 2.62 : 0.18;
      gift.reward.position.y += (rewardY - gift.reward.position.y) * (1 - Math.exp(-dt * 2.8));
      gift.reward.rotation.y += ((target ? 0.22 : 0) - gift.reward.rotation.y) * easing;
      gift.reward.rotation.z += ((target ? -0.035 : 0) - gift.reward.rotation.z) * easing;
      gift.glow.intensity += ((target ? 5.2 : 0) - gift.glow.intensity) * easing;
      gift.glow.position.y = 2.15 + (target ? 0.5 : 0);
      if (!reducedMotion && !target) gift.reward.position.y = 0.18 + Math.sin(time * 0.0013) * 0.018;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    const resize = () => {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); gift.dispose(); renderer.dispose(); };
  }, []);

  return <div className={`welcome-gift-3d ${className}`} aria-label={opened ? "Opened SETHIS welcome gift revealing 3,500 GT" : "Closed SETHIS three-dimensional welcome gift box"}>
    <canvas ref={canvasRef} className="welcome-gift-3d-canvas" />
  </div>;
}
