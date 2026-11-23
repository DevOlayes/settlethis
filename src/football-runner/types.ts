import type * as THREE from "three";

export type RunnerPhase = "ready" | "running" | "paused" | "over";
export type RunnerRenderQuality = "low" | "balanced" | "high";
export type RunnerAction = "left" | "right" | "jump" | "slide";
export type RunnerSummary = {
  distance: number;
  points: number;
  balls: number;
  distancePoints: number;
  footballPoints: number;
  rewardFootball: number;
  rewardDistance: number;
  rewardPerformance: number;
  sethis: number;
  dailyPreviewEarned?: number;
  dailyPreviewTotal?: number;
  dailyPreviewRemaining?: number;
};
export type RunnerRunRecord = {
  playedAt: number;
  distance: number;
  points: number;
  balls: number;
};
export type RunnerRecords = {
  bestDistance: number;
  bestPoints: number;
  totalRuns: number;
  recentRuns: RunnerRunRecord[];
};
export type RunnerHud = {
  distance: number;
  points: number;
  balls: number;
  speed: number;
};
export type RunnerEngineCallbacks = {
  onPerformance?: (metrics: RunnerPerformanceSnapshot) => void;
  onEnvironmentStatus?: (status: "loading" | "ready" | "error") => void;
  onPhase: (phase: RunnerPhase) => void;
  onHud: (hud: RunnerHud) => void;
  onSummary: (summary: RunnerSummary) => void;
};
export type RunnerPerformanceSnapshot = {
  fps: number;
  averageFrameMs: number;
  worstFrameMs: number;
  slowFrames: number;
  slowFrameRatio: number;
  framesSampled: number;
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
  environmentRoot: THREE.Group;
  renderQuality: RunnerRenderQuality;
};
