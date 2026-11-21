import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

type Props = { onBack: () => void };

const MODEL_URL = "/assets/football-runner/player.glb";

export default function AvatarDiagnostic({ onBack }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [checks, setChecks] = useState<string[]>(["Waiting to start the direct model test…"]);
  const [failure, setFailure] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let model: THREE.Group | undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9dc8dd);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
    camera.position.set(0, 1.15, 4.8);
    camera.lookAt(0, 1.05, 0);

    const addCheck = (message: string) => {
      if (!disposed) setChecks((current) => [...current, message]);
    };

    const resize = () => {
      if (!renderer || !host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "default" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      host.appendChild(renderer.domElement);
      resize();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFailure("WebGL renderer could not start: " + message);
      addCheck("FAILED: WebGL renderer could not start");
      return;
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x526c48, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9edff, 1.1);
    fill.position.set(4, 4, -3);
    scene.add(fill);

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshStandardMaterial({ color: 0x438d4c, roughness: 1 }),
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = -0.025;
    scene.add(pitch);
    const centre = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.13, 64),
      new THREE.MeshBasicMaterial({ color: 0xf5f1e9, side: THREE.DoubleSide }),
    );
    centre.rotation.x = -Math.PI / 2;
    centre.position.y = -0.018;
    scene.add(centre);
    const halfway = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xf5f1e9 }),
    );
    halfway.rotation.x = -Math.PI / 2;
    halfway.position.set(0, -0.017, 0);
    scene.add(halfway);

    const render = () => {
      if (disposed || !renderer) return;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const load = async () => {
      try {
        addCheck("Requesting " + MODEL_URL);
        const response = await fetch(MODEL_URL, { cache: "no-store" });
        addCheck("Model request returned HTTP " + response.status);
        if (!response.ok) throw new Error("Model request failed with HTTP " + response.status);
        const buffer = await response.arrayBuffer();
        addCheck("Downloaded " + buffer.byteLength.toLocaleString() + " bytes");

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        addCheck("Decoding the original GLB directly (no retargeting or bone renaming)…");
        const gltf = await loader.parseAsync(buffer, window.location.origin + "/");
        if (disposed) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material) => material.dispose());
            }
          });
          return;
        }

        model = gltf.scene;
        let meshes = 0;
        let bones = 0;
        let materials = 0;
        model.traverse((object) => {
          if (object instanceof THREE.Bone) bones++;
          if (object instanceof THREE.Mesh) {
            meshes++;
            object.castShadow = true;
            object.receiveShadow = true;
            const list = Array.isArray(object.material) ? object.material : [object.material];
            materials += list.length;
          }
        });
        addCheck("GLB decoded successfully");
        addCheck("Meshes: " + meshes + " · bones: " + bones + " · materials: " + materials);
        if (meshes === 0) throw new Error("The GLB decoded, but it contains no renderable meshes.");

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const height = size.y;
        if (!Number.isFinite(height) || height <= 0.001) throw new Error("The model has an invalid or zero-height bounding box.");
        const scale = 2.05 / height;
        model.scale.setScalar(scale);
        model.position.set(
          -((bounds.min.x + bounds.max.x) * 0.5) * scale,
          -bounds.min.y * scale,
          -((bounds.min.z + bounds.max.z) * 0.5) * scale,
        );
        model.updateMatrixWorld(true);
        scene.add(model);
        addCheck("Original model height: " + height.toFixed(3) + " units");
        addCheck("Scaled to approximately 2.05 metres and added to the pitch");
        addCheck("SPORTS MALE 03 IS NOW RENDERED — STATIC TEST PASSED");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!disposed) {
          setFailure(message);
          addCheck("MODEL TEST FAILED: " + message);
        }
      }
    };

    void load();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (model) {
        scene.remove(model);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry.dispose();
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value instanceof THREE.Texture) value.dispose();
            });
            material.dispose();
          });
        });
      }
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object === model) return;
        object.geometry.dispose();
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => material.dispose());
      });
      renderer?.dispose();
      if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#171522", color: "#f4f1f7", display: "flex", flexDirection: "column", fontFamily: "Manrope, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: "1px solid #393346" }}>
        <button type="button" onClick={onBack} style={{ border: 0, borderRadius: 10, background: "#302b3d", color: "#f4f1f7", padding: "10px 14px", fontWeight: 800 }}>← BACK</button>
        <div><b style={{ display: "block", letterSpacing: 1 }}>SETHIS</b><small style={{ color: "#aaa3b5", letterSpacing: 1 }}>SPORTS MALE 03 · STATIC MODEL TEST</small></div>
      </header>
      <div style={{ position: "relative", flex: 1, minHeight: 430, overflow: "hidden", background: "#9dc8dd" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", left: 12, right: 12, top: 12, maxWidth: 440, maxHeight: "48%", overflowY: "auto", background: "rgba(23,21,34,.94)", border: "1px solid #62586d", borderRadius: 12, padding: 12, boxShadow: "0 8px 28px rgba(0,0,0,.22)" }}>
          <b style={{ fontSize: 12, letterSpacing: 1 }}>LIVE MODEL DIAGNOSTICS</b>
          <div aria-live="polite" style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {checks.map((check, index) => <div key={index} style={{ fontSize: 12, lineHeight: 1.45, color: check.includes("FAILED") ? "#ff9a8e" : check.includes("PASSED") ? "#8ee3ae" : "#e4deeb" }}>{check}</div>)}
          </div>
          {failure && <div role="alert" style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "rgba(233,130,114,.14)", color: "#ffb0a2", fontSize: 12, overflowWrap: "anywhere" }}>Exact error: {failure}</div>}
        </div>
      </div>
      <footer style={{ padding: "12px 16px", color: "#aaa3b5", fontSize: 11, lineHeight: 1.5, borderTop: "1px solid #393346" }}>
        Animation and gameplay are deliberately disabled. This test loads the model file directly and never substitutes the original procedural runner.
      </footer>
    </main>
  );
}
