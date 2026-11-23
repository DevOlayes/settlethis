import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadRunnerAnimationManifest, loadRunnerCharacter, disposeRunnerCharacterModel } from "./football-runner/RiggedPlayerAsset";

const CLUB_GROUND_URL = "https://cdn.3dassets.dev/assets/19143/v1/model.glb";
const TRAINING_CORNER_URL = "https://cdn.3dassets.dev/assets/19144/v1/model.glb";

type Props = { onBack: () => void };

export default function FootballEnvironmentPrototype({ onBack }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Preparing the club ground…");
  const [error, setError] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let frame = 0;
    const clock = new THREE.Clock();
    const loader = new GLTFLoader();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bc9df);
    scene.fog = new THREE.Fog(0x9bc9df, 75, 190);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 260);
    camera.position.set(2.8, 4.1, 31);
    camera.lookAt(0, 1.1, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "default" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x526746, 1.65));
    const sun = new THREE.DirectionalLight(0xfff1d7, 2.7);
    sun.position.set(-28, 42, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -72;
    sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 72;
    sun.shadow.camera.bottom = -72;
    sun.shadow.bias = -0.00015;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd8eaff, 0.72);
    fill.position.set(24, 15, -30);
    scene.add(fill);

    const world = new THREE.Group();
    scene.add(world);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.1, 8);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 7;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.update();

    let player: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const load = async () => {
      try {
        setStatus("Loading the assembled football ground…");
        const ground = await loader.loadAsync(CLUB_GROUND_URL);
        if (disposed) return;
        ground.scene.name = "SETHIS assembled club ground";
        ground.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = true;
            const surfaces = Array.isArray(object.material) ? object.material : [object.material];
            surfaces.forEach((surface) => {
              if (surface instanceof THREE.MeshStandardMaterial) {
                surface.roughness = Math.max(surface.roughness, 0.72);
              }
            });
          }
        });
        world.add(ground.scene);

        setStatus("Adding the football training area…");
        const training = await loader.loadAsync(TRAINING_CORNER_URL);
        if (disposed) return;
        training.scene.name = "SETHIS training equipment layout";
        training.scene.position.set(23, 0.02, -19);
        training.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        world.add(training.scene);

        setStatus("Loading Sports Male 03…");
        const loaded = await loadRunnerCharacter();
        if (disposed) {
          disposeRunnerCharacterModel(loaded.model);
          return;
        }
        player = loaded.model;
        player.rotation.y = Math.PI;
        player.position.set(0, 0, 20);
        world.add(player);

        setStatus("Preparing the original running animation…");
        const clips = await loadRunnerAnimationManifest(player);
        if (disposed) return;
        const runClip = clips.find((clip) => /sports-male-03-native-run|run|jog/i.test(clip.name)) || clips[0];
        if (runClip) {
          mixer = new THREE.AnimationMixer(player);
          mixer.clipAction(runClip).reset().play();
        }

        setStatus("Environment prototype ready");
      } catch (cause) {
        console.error("Football environment prototype failed to load", cause);
        if (!disposed) {
          setError(cause instanceof Error ? cause.message : "One or more 3D assets could not be loaded.");
          setStatus("Preview could not finish loading");
        }
      }
    };

    const resize = () => {
      if (!host || disposed) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const render = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      mixer?.update(delta);
      controls.update();
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("resize", resize);
    void load();
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((surface) => {
          Object.values(surface).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          surface.dispose();
        });
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#171522", color: "#f4f1f7", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      <header style={{ position: "absolute", zIndex: 2, top: 0, left: 0, right: 0, padding: "max(16px, env(safe-area-inset-top)) 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "linear-gradient(180deg, rgba(15,14,24,.9), rgba(15,14,24,0))", pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ color: "#e98272", fontSize: 10, fontWeight: 900, letterSpacing: ".2em" }}>SETHIS · FOOTBALL RUNNER</div>
          <div style={{ fontSize: 17, fontWeight: 850, marginTop: 4 }}>Environment prototype</div>
          <div style={{ color: "#e2dce8", fontSize: 11, marginTop: 3 }}>Club ground + training zone + Sports Male 03</div>
        </div>
        <button onClick={onBack} style={{ pointerEvents: "auto", border: "1px solid #ffffff35", borderRadius: 999, background: "#211e2bcc", color: "#fff", padding: "10px 15px", fontWeight: 800 }}>Close</button>
      </header>
      <footer style={{ position: "absolute", zIndex: 2, left: 12, right: 12, bottom: "max(14px, env(safe-area-inset-bottom))", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ maxWidth: 520, padding: "10px 14px", border: "1px solid #ffffff25", borderRadius: 12, background: "#171522d9", backdropFilter: "blur(12px)", textAlign: "center", boxShadow: "0 10px 35px #0005" }}>
          <div style={{ fontSize: 11, fontWeight: 800 }}>{status}</div>
          <div style={{ color: "#c7c0ce", fontSize: 10, marginTop: 4 }}>Drag to orbit · Pinch or scroll to zoom · Prototype only</div>
          {error && <div style={{ color: "#ffb1a5", fontSize: 10, marginTop: 5 }}>{error}</div>}
        </div>
      </footer>
    </main>
  );
}
