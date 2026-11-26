import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Confetti from "react-confetti";
import BrandMark from "./BrandMark";
import "./GiftBoxPreview.css";

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

  // Only the 3,500 GT reward rises from the gift: no box, plaque or extra object.
  const reward = new THREE.Group();
  reward.position.set(0, 0.22, 0);
  box.add(reward);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 768;
  labelCanvas.height = 384;
  const labelCtx = labelCanvas.getContext("2d");
  if (labelCtx) {
    labelCtx.clearRect(0, 0, 768, 384);
    labelCtx.shadowColor = "#f6c39d";
    labelCtx.shadowBlur = 28;
    labelCtx.textAlign = "center";
    labelCtx.textBaseline = "middle";
    labelCtx.fillStyle = "#fff7ed";
    labelCtx.font = "900 132px Arial";
    labelCtx.fillText("3,500", 384, 158);
    labelCtx.shadowBlur = 18;
    labelCtx.fillStyle = "#f6c39d";
    labelCtx.font = "900 76px Arial";
    labelCtx.fillText("GT", 384, 265);
  }
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const rewardText = new THREE.Mesh(
    new THREE.PlaneGeometry(1.95, 0.98),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  rewardText.position.set(0, 0.25, 0.28);
  reward.add(rewardText);
  const rewardHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 1.25),
    new THREE.MeshBasicMaterial({ color: 0xf6c39d, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })
  );
  rewardHalo.position.set(0, 0.24, 0.22);
  reward.add(rewardHalo);

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

export default function GiftBoxPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(0);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
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
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -4;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb9a5ff, 1.5);
    rim.position.set(4, 4, -4);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.28 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    scene.add(floor);

    const gift = buildGift(scene);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = 0;
    const animate = (time: number) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((time - (last || time)) / 1000, 0.04);
      last = time;
      const target = openedRef.current ? 1 : 0;
      const easing = 1 - Math.exp(-dt * (reducedMotion ? 40 : 3.1));
      const lidTarget = target ? gift.lidOpenTarget : 0;
      gift.lid.rotation.x += (lidTarget - gift.lid.rotation.x) * easing;
      const rewardY = target ? 2.45 : 0.22;
      gift.reward.position.y += (rewardY - gift.reward.position.y) * (1 - Math.exp(-dt * 2.8));
      gift.reward.rotation.y += ((target ? 0.12 : 0) - gift.reward.rotation.y) * easing;
      gift.glow.intensity += ((target ? 5.2 : 0) - gift.glow.intensity) * easing;
      gift.glow.position.y = 2.15 + (target ? 0.5 : 0);
      if (!reducedMotion && !target) {
        gift.reward.position.y = 0.22 + Math.sin(time * 0.0013) * 0.018;
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    const resize = () => {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gift.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const openGift = () => {
    if (opened) return;
    setOpened(true);
    setBurst(value => value + 1);
  };
  const resetGift = () => setOpened(false);

  return (
    <main className={`gift-preview-page ${opened ? "is-open" : ""}`}>
      {opened && <Confetti key={burst} width={viewport.width} height={viewport.height} numberOfPieces={190} recycle={false} gravity={0.19} tweenDuration={5200} frameRate={40} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }} />}
      <header className="gift-preview-header">
        <a className="gift-preview-brand" href="/" aria-label="SETHIS home">
          <BrandMark className="gift-preview-brand-mark" />
          <span><b>SETTLE</b><i>THIS!</i></span>
        </a>
        <span className="gift-preview-tag">WELCOME GIFT PREVIEW</span>
      </header>
      <section className="gift-preview-content">
        <span className="gift-preview-eyebrow">A LITTLE SOMETHING FROM SETHIS</span>
        <h1>{opened ? "Your welcome gift is here." : "Your first gift is waiting."}</h1>
        <p className="gift-preview-intro">{opened ? "A warm welcome to the football reward arena." : "Tap the present to unwrap your 3,500 GT welcome gift."}</p>
        <div className="gift-preview-scene">
          <div className="gift-preview-aura" />
          <div className="gift-preview-floor-glow" />
          <button type="button" className="gift-preview-object" onClick={openGift} disabled={opened} aria-label="Open the 3,500 GT welcome gift" aria-expanded={opened}>
            <canvas ref={canvasRef} className="gift-preview-canvas" aria-label="A three-dimensional coral gift box wrapped in gold satin ribbon with a sculpted bow" />
          </button>
          <div className="gift-preview-caption" aria-live="polite">{opened ? "YOUR 3,500 GT GIFT IS REVEALED" : "TAP THE PRESENT TO OPEN"}</div>
        </div>
        <div className="gift-preview-actions">
          {!opened ? <button type="button" className="gift-preview-open-button" onClick={openGift}>UNWRAP YOUR 3,500 GT GIFT <span>↗</span></button> : <button type="button" className="gift-preview-open-button" onClick={resetGift}>REPLAY THE REVEAL <span>↻</span></button>}
          <span className="gift-preview-safety-note">DESIGN PREVIEW ONLY · NO TOKENS ARE CLAIMED OR CREDITED</span>
        </div>
      </section>
      <footer className="gift-preview-footer"><span><BrandMark className="gift-preview-footer-mark"/> SETHIS · FOOTBALL REWARD ARENA</span><a href="/">BACK TO SETHIS INTRODUCTION ↗</a></footer>
    </main>
  );
}
