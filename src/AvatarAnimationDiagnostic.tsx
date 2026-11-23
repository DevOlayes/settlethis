import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { loadRunnerAnimationManifest, loadRunnerCharacter, disposeRunnerCharacterModel } from "./football-runner/RiggedPlayerAsset";
import { createNativeBipedJumpClips } from "./football-runner/NativeBipedJump";
import { createNativeBipedManeuverClips, NATIVE_BIPED_MANEUVER_PHASES } from "./football-runner/NativeBipedManeuvers";
import { createNativeBipedSlideContactRig } from "./football-runner/NativeBipedPoseTools";

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
    let phaseActions: Record<string, THREE.AnimationAction> = {};
    let phaseIndex = 0;
    let phaseElapsed = 0;
    let jumpElapsed = 0;
    let modelBaseX = 0;
    let modelBaseY = 0;
    let modelBaseZ = 0;
    let slideContactRig: ReturnType<typeof createNativeBipedSlideContactRig>;
    let contactAuditLogged = false;
    let playbackReady = false;
    let previewCycle = 0;
    const phaseNames = ["run", "jumpTakeoff", "jumpAir", "jumpLand", "runAfterJump", "slideStart", "slideLoop", "slideRecovery", "runAfterSlide", "laneLeft", "runAfterLeft", "laneRight", "runAfterRight"];
    const phaseDurations = [1.4, 0.22, 0.48, 0.32, 0.85, NATIVE_BIPED_MANEUVER_PHASES.slideStart, NATIVE_BIPED_MANEUVER_PHASES.slideLoop, NATIVE_BIPED_MANEUVER_PHASES.slideRecovery, 0.85, NATIVE_BIPED_MANEUVER_PHASES.laneChange, 0.85, NATIVE_BIPED_MANEUVER_PHASES.laneChange, 0.85];
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

    const playPhase = (index: number) => {
      const name = phaseNames[index];
      const next = (name === "laneLeft" || name === "laneRight") ? phaseActions.run : phaseActions[name];
      if (!next) return;
      const previous = action;
      const isRun = next === phaseActions.run;
      // Keep the same run action advancing underneath jumps and reuse its
      // current gait phase when returning; never restart the stride at a turn.
      if (!isRun || !next.isRunning()) next.reset();
      next.enabled = true;
      next.paused = false;
      next.setEffectiveWeight(1);
      next.setEffectiveTimeScale(1);
      const looping = name === "run" || name === "jumpAir" || name === "slideLoop";
      next.setLoop(looping ? THREE.LoopRepeat : THREE.LoopOnce, looping ? Infinity : 1);
      next.clampWhenFinished = !looping;
      if (previous !== next) next.fadeIn(previous ? 0.16 : 0);
      next.play();
      if (previous && previous !== next) {
        if (previous === phaseActions.run && ["jumpTakeoff", "jumpAir", "jumpLand"].includes(name)) {
          previous.setEffectiveWeight(1);
        } else if (next === phaseActions.run) {
          previous.fadeOut(0.16);
          
        } else {
          previous.fadeOut(0.16);
        }
      }
      action = next;
      if (previewCycle === 0) addCheck("Preview phase: " + name);
    };

    const render = (now: number) => {
      if (disposed || !renderer) return;
      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
      previousTime = now;
      if (playbackReady && mixer && action) {
        phaseElapsed += delta;
        const phase = phaseNames[phaseIndex];
        const phaseProgress = Math.min(1, phaseElapsed / Math.max(0.001, phaseDurations[phaseIndex]));
        const eased = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
        if (["jumpTakeoff", "jumpAir", "jumpLand"].includes(phase)) {
          jumpElapsed += delta;
          model!.position.y = modelBaseY + Math.sin(Math.min(1, jumpElapsed / 1.02) * Math.PI) * 1.5;
        } else if (model) {
          let verticalOffset = 0;
          let lateralOffset = 0;
          if (phase === "slideStart") verticalOffset = -1.03 * eased;
          if (phase === "slideLoop") verticalOffset = -1.03;
          if (phase === "slideRecovery") verticalOffset = -1.03 * (1 - eased);
          if (phase === "laneLeft") lateralOffset = -0.62 * eased;
          if (phase === "runAfterLeft") lateralOffset = -0.62 * (1 - eased);
          if (phase === "laneRight") lateralOffset = 0.62 * eased;
          if (phase === "runAfterRight") lateralOffset = 0.62 * (1 - eased);
          const laneSign = phase === "laneLeft" ? 1 : phase === "laneRight" ? -1 : 0;
          const laneBank = laneSign * Math.sin(phaseProgress * Math.PI) * 0.17;
          model.position.set(modelBaseX + lateralOffset, modelBaseY + verticalOffset, modelBaseZ);
          model.rotation.x = 0; // Let the Biped pose recline naturally; no head-first root pitch.
          model.rotation.z = laneBank;
        }
        if (phaseElapsed >= phaseDurations[phaseIndex]) {
          phaseElapsed = 0;
          phaseIndex = (phaseIndex + 1) % phaseNames.length;
          if (phaseIndex === 0) {
            previewCycle++;
            if (model) { model.position.set(modelBaseX, modelBaseY, modelBaseZ); model.rotation.set(0, 0, 0); }
          }
          if (phaseNames[phaseIndex] === "jumpTakeoff") jumpElapsed = 0;
          playPhase(phaseIndex);
        }
        if (["slideStart", "slideLoop", "slideRecovery", "runAfterSlide"].includes(phase)) {
          slideContactRig?.restore();
        }
        mixer.update(delta);
        if ((phase === "slideStart" || phase === "slideLoop") && slideContactRig) {
          const errors = slideContactRig.solve(-0.025);
          if (phase === "slideLoop" && !contactAuditLogged) {
            addCheck("Pitch contact residuals · shoulder " + errors.shoulder.toFixed(3) +
              "m · palm " + errors.palm.toFixed(3) +
              "m · lead foot " + errors.leadFoot.toFixed(3) +
              "m · trailing foot " + errors.trailingFoot.toFixed(3) + "m.");
            contactAuditLogged = true;
          }
        } else if (phase === "runAfterSlide") {
          slideContactRig?.clear();
        }
      }
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
        slideContactRig = createNativeBipedSlideContactRig(model);
        addCheck("Sports Male 03 loaded with its original, unchanged Bip01 skeleton.");
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
        addCheck("Successfully loaded compatible motion clips: " + imported.length);
        const run = [...loaded.animations, ...imported].find((clip) => /run|jog|walk|locomotion/i.test(clip.name));
        if (!run) {
          addCheck("NO IMPORTED RUN CLIP PASSED RETARGETING — model remains visible and unchanged.");
          throw new Error("No imported run/jog/walk clip passed retargeting. See the console for per-clip rejection details.");
        }
        const trackBones = new Set(run.tracks.map((track) => track.name.split(".")[0]));
        addCheck("Selected motion: " + run.name);
        addCheck("Animation duration: " + run.duration.toFixed(2) + " seconds");
        addCheck("Animation tracks: " + run.tracks.length + " · driven bones: " + trackBones.size);
        const normalize = (value: string) => value.replace(/_/g, " ").toLowerCase();
        const normalizedTracks = new Set([...trackBones].map(normalize));
        const required = ["Bip01 Pelvis", "Bip01 L Thigh", "Bip01 R Thigh", "Bip01 L Calf", "Bip01 R Calf", "Bip01 L UpperArm", "Bip01 R UpperArm"];
        const missing = required.filter((bone) => !normalizedTracks.has(normalize(bone)));
        addCheck(missing.length ? "Missing key locomotion bones: " + missing.join(", ") : "All key leg, hip and arm tracks are present.");
        const jumpClips = createNativeBipedJumpClips(model, run);
        const maneuverClips = createNativeBipedManeuverClips(model, run);
        const [takeoff, air, land] = jumpClips;
        if (!takeoff?.tracks.length || !air?.tracks.length || !land?.tracks.length || maneuverClips.length !== 5 || maneuverClips.some((clip) => !clip.tracks.length)) {
          throw new Error("The native Biped jump prototype could not find enough matching Sports Male 03 bones.");
        }
        addCheck("Native Biped jump clips created without retargeting or changing the skeleton.");
        addCheck("Jump takeoff: " + takeoff.tracks.length + " tracks · " + takeoff.duration.toFixed(2) + "s");
        addCheck("Airborne loop: " + air.tracks.length + " tracks · " + air.duration.toFixed(2) + "s");
        addCheck("Landing: " + land.tracks.length + " tracks · " + land.duration.toFixed(2) + "s");
        addCheck("Jump root arc: 1.02s · 1.5m preview; running gait remains blended underneath so the stride does not restart.");
        maneuverClips.forEach((clip) => addCheck("Native manoeuvre: " + clip.name + " · " + clip.tracks.length + " tracks · " + clip.duration.toFixed(2) + "s"));
        addCheck("Slide sequence: lead leg extended forward, torso/head reclined, one hand bracing behind → recovery.");
        addCheck("Lane sequence: uninterrupted run stride + smooth lateral travel + directional body bank.");
        mixer = new THREE.AnimationMixer(model);
        modelBaseX = model.position.x;
        modelBaseY = model.position.y;
        modelBaseZ = model.position.z;
        phaseActions = {
          run: mixer.clipAction(run),
          jumpTakeoff: mixer.clipAction(takeoff),
          jumpAir: mixer.clipAction(air),
          jumpLand: mixer.clipAction(land),
          slideStart: mixer.clipAction(maneuverClips[0]),
          slideLoop: mixer.clipAction(maneuverClips[1]),
          slideRecovery: mixer.clipAction(maneuverClips[2]),
          laneLeft: mixer.clipAction(maneuverClips[3]),
          laneRight: mixer.clipAction(maneuverClips[4]),
          runAfterJump: mixer.clipAction(run),
          runAfterSlide: mixer.clipAction(run),
          runAfterLeft: mixer.clipAction(run),
          runAfterRight: mixer.clipAction(run),
        };
        phaseIndex = 0;
        phaseElapsed = 0;
        playPhase(0);
        playbackReady = true;
        addCheck("Diagnostic sequence: RUN → JUMP → RUN → SLIDE START → SLIDE LOOP → RECOVERY → RUN → LEFT LANE CHANGE → RUN → RIGHT LANE CHANGE → RUN.");
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
        <div><b style={{ display: "block", letterSpacing: 1 }}>SETHIS</b><small style={{ color: "#aaa3b5", letterSpacing: 1 }}>SPORTS MALE 03 · JUMP / SLIDE / LANE TEST</small></div>
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
        Isolated animation preview: jump, a visibly lowered compact slide with recovery, and left/right lane changes with clear lateral travel and body counterbalance. Original model and skeleton remain unchanged; gameplay and rewards are not affected.
      </footer>
    </main>
  );
}
