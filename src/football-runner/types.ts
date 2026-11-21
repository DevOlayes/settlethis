import type * as THREE from "three";

export type RunnerPhase = "ready" | "running" | "paused" | "over";
export type RunnerAction = "left" | "right" | "jump" | "slide";
export type RunnerSummary = {
  distance: number;
  points: number;
  balls: number;
  sethis: number;
};
export type RunnerHud = {
  distance: number;
  points: number;
  balls: number;
  speed: number;
};
export type RunnerEngineCallbacks = {
  onPerformance?: (metrics: RunnerPerformanceSnapshot) => void;
  onPhase: (phase: RunnerPhase) => void;
  onHud: (hud: RunnerHud) => void;
  onSummary: (summary: RunnerSummary) => void;
};
export type RunnerPerformanceSnapshot = {
  fps: number;
  averageFrameMs: number;
  worstFrameMs: number;
  slowFrames: number;
};

export type RunnerControls = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  act: (action: RunnerAction) => void;
  setSoundEnabled: (enabled: boolean) => void;
};
export type RunnerSceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  world: THREE.Group;
};
