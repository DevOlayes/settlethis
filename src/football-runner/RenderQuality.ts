import * as THREE from "three";
import type { RunnerSceneBundle, RunnerRenderQuality } from "./types";

const QUALITY_SETTINGS: Record<RunnerRenderQuality, { pixelRatio: number; shadowMapSize: number }> = {
  low: { pixelRatio: 0.72, shadowMapSize: 0 },
  balanced: { pixelRatio: 0.88, shadowMapSize: 0 },
  high: { pixelRatio: 1.08, shadowMapSize: 512 },
};

export function getInitialRunnerRenderQuality(): RunnerRenderQuality {
  if (typeof navigator === "undefined") return "balanced";
  const device = navigator as Navigator & { deviceMemory?: number };
  const memory = device.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency || 4;
  if (memory <= 2 || cores <= 2) return "low";
  const coarsePointer = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (coarsePointer || memory <= 4 || cores <= 4) return "balanced";
  return "high";
}

export function applyRunnerRenderQuality(bundle: RunnerSceneBundle, quality: RunnerRenderQuality): void {
  if (bundle.renderQuality === quality) return;
  const settings = QUALITY_SETTINGS[quality];
  const size = bundle.renderer.getSize(new THREE.Vector2());
  bundle.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatio));
  bundle.renderer.setSize(size.x, size.y, false);

  bundle.renderer.shadowMap.enabled = quality === "high";
  bundle.scene.traverse((object) => {
    if (!(object instanceof THREE.DirectionalLight) || object.userData.runnerShadowLight !== true) return;
    object.castShadow = quality !== "low";
    object.shadow.map?.dispose();
    object.shadow.map = null;
    if (settings.shadowMapSize > 0) object.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
  });
  bundle.renderer.shadowMap.needsUpdate = true;
  bundle.renderQuality = quality;
}
