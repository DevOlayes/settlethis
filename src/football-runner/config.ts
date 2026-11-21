export const RUNNER_CONFIG = {
  colors: {
    background: 0x171522,
    coral: 0xe98272,
    pitch: 0x263a32,
  },
  lanes: [-1, 0, 1] as const,
  laneWidth: 2.9,
  playerStartZ: 2.3,
  camera: {
    fov: 58,
    near: 0.1,
    far: 180,
    start: [0, 5.1, 10.5] as const,
    lookAt: [0, 1, -7] as const,
  },
  world: {
    length: 180,
    centreZ: -48,
    fogNear: 34,
    fogFar: 115,
  },
  movement: {
    initialSpeed: 9,
    maximumSpeed: 20,
    speedRampPerSecond: 0.085,
    laneResponse: 13,
    jumpDuration: 1.02,
    jumpHeight: 1.5,
    slideDuration: 0.65,
  },
  spawning: {
    startDistance: 105,
    intervalStart: 1.45,
    intervalMinimum: 0.72,
    intervalRamp: 0.006,
    ballChance: 0.62,
    initialObjects: 8,
    initialSpacing: 13,
  },
  collision: {
    depth: 0.85,
    width: 1.05,
  },
  ui: {
    updateInterval: 0.18,
  },
} as const;

export const RUNNER_REWARD_DEMO = {
  ballValue: 5,
  distanceStep: 500,
  distanceBonus: 4,
  performanceThresholds: [
    { points: 10000, bonus: 8 },
    { points: 5000, bonus: 4 },
  ],
  dailyDisplayCap: 1500,
} as const;
