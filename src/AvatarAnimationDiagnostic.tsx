import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { loadRunnerAnimationManifest, loadRunnerCharacter, disposeRunnerCharacterModel } from "./football-runner/RiggedPlayerAsset";

type Props = { onBack: () => void };

export default function AvatarAnimationDiagnostic({ onBack }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [checks, setChecks] = useState<string[]>(["Preparing the approved Sports Male 03 model and imported run animation…"]);
  const [failure, setFailure] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let model: THREE.Group | undefined;
    let mixer: THREE.AnimationMixer | undefined;
    let action: THREE.AnimationAction | undefined;
    let previousTime = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9dc8dd);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
    camera.position.set(0, 1.15, 4.8);
    camera.lookAt(0, 1.05, 0);
    const addCheck = (message: string) => { if (!disposed) setChecks((current) => [...current, message]); };
    const resize = () => {
      if (!renderer) return;
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
      setFailure("WebGL renderer could not start: " + (error instanceof Error ? error.message : String(error)));
      return;
    }
    scene.add(new THREE.HemisphereLight(0xffffff, 0x526c48, 2));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 7, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9edff, 1.1);
    fill.position.set(4, 4, -3);
    scene.add(fill);
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: 0x438d4c, roughness: 1 }));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = -0.025;
    scene.add(pitch);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.025), new THREE.MeshBasicMaterial({ color: 0xf5f1e9 }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, -0.017, 0);
    scene.add(line);

    const render = (now: number) => {
      if (disposed || !renderer) return;
      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
      previousTime = now;
      if (mixer && action) mixer.update(delta);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const load = async () => {
      try {
        addCheck("Loading the exact Sports Male 03 GLB through the production loader…");
        const loaded = await loadRunnerCharacter();
        model = loaded.model;
        if (disposed) { disposeRunnerCharacterModel(model); return; }
        scene.add(model);
        const hierarchy = model.userData.runnerRigHierarchy as
          | { normalized?: boolean; changes?: string[]; verified?: number }
          | undefined;
        addCheck("Sports Male 03 loaded: " + model.name);
        addCheck(hierarchy?.normalized
          ? `Sports Male 03 rig hierarchy corrected and verified: ${hierarchy.verified ?? 0} limb branches.`
          : "Sports Male 03 rig hierarchy was not normalized.");
        if (hierarchy?.changes?.length) addCheck("Rig branch corrections: " + hierarchy.changes.join("; "));
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const height = Math.max(0.1, bounds.max.y - bounds.min.y);
        const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.28;
        camera.position.set(center.x, center.y + height * 0.035, center.z + distance);
        camera.lookAt(center.x, center.y, center.z);
        addCheck("Diagnostic camera framed to the complete footballer.");
        addCheck("Embedded animation clips: " + loaded.animations.length);
        addCheck("Loading the locally bundled online motion library…");
        const imported = await loadRunnerAnimationManifest(model);
        if (disposed) return;
        addCheck("Successfully retargeted clips: " + imported.length);
        const run = [...loaded.animations, ...imported].find((clip) => /run|jog|walk|locomotion/i.test(clip.name));
        if (!run) {
          addCheck("NO IMPORTED RUN CLIP PASSED RETARGETING — model remains visible and unchanged.");
          throw new Error("No imported run/jog/walk clip passed retargeting. See the console for per-clip rejection details.");
        }
        const trackBones = new Set(run.tracks.map((track) => track.name.split(".")[0]));
        addCheck("Selected motion: " + run.name);
        addCheck("Animation duration: " + run.duration.toFixed(2) + " seconds");
        addCheck("Animation tracks: " + run.tracks.length + " · driven bones: " + trackBones.size);
        const required = ["Hips", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg", "LeftArm", "RightArm"];
        const missing = required.filter((bone) => !trackBones.has(bone));
        addCheck(missing.length ? "Missing key locomotion bones: " + missing.join(", ") : "All key leg, hip and arm tracks are present.");
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(run);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.play();
        addCheck("IMPORTED RUN ANIMATION IS PLAYING ON SPORTS MALE 03.");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!disposed) { setFailure(message); addCheck("ANIMATION TEST NEEDS ATTENTION: " + message); }
      }
    };
    void load();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mixer?.stopAllAction();
      if (model) { scene.remove(model); disposeRunnerCharacterModel(model); }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer?.dispose();
      if (renderer?.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "#171522", color: "#f4f1f7", display: "flex", flexDirection: "column", fontFamily: "Manrope, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: "1px solid #393346" }}>
        <button type="button" onClick={onBack} style={{ border: 0, borderRadius: 10, background: "#302b3d", color: "#f4f1f7", padding: "10px 14px", fontWeight: 800 }}>← BACK</button>
        <div><b style={{ display: "block", letterSpacing: 1 }}>SETHIS</b><small style={{ color: "#aaa3b5", letterSpacing: 1 }}>SPORTS MALE 03 · RUN ANIMATION TEST</small></div>
      </header>
      <div style={{ position: "relative", flex: 1, minHeight: 430, overflow: "hidden", background: "#9dc8dd" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", left: 12, right: 12, top: 12, maxWidth: 460, maxHeight: "55%", overflowY: "auto", background: "rgba(23,21,34,.94)", border: "1px solid #62586d", borderRadius: 12, padding: 12, boxShadow: "0 8px 28px rgba(0,0,0,.22)" }}>
          <b style={{ fontSize: 12, letterSpacing: 1 }}>LIVE ANIMATION DIAGNOSTICS</b>
          <div aria-live="polite" style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {checks.map((check, index) => <div key={index} style={{ fontSize: 12, lineHeight: 1.45, color: check.includes("ATTENTION") || check.includes("NO IMPORTED") ? "#ffb0a2" : check.includes("PLAYING") ? "#8ee3ae" : "#e4deeb" }}>{check}</div>)}
          </div>
          {failure && <div role="alert" style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "rgba(233,130,114,.14)", color: "#ffb0a2", fontSize: 12, overflowWrap: "anywhere" }}>Exact error: {failure}</div>}
        </div>
      </div>
      <footer style={{ padding: "12px 16px", color: "#aaa3b5", fontSize: 11, lineHeight: 1.5, borderTop: "1px solid #393346" }}>
        This isolated test uses imported animation clips only. It does not run gameplay, alter rewards or substitute the procedural character.
      </footer>
    </main>
  );
}
