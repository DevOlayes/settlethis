declare module "@three-ws/retarget" {
  import type { AnimationClip, Object3D } from "three";

  export const MIN_COVERAGE: number;

  export function canonicalizeGLBBones(
    input: ArrayBuffer,
  ): { buffer: ArrayBuffer };

  export function retargetClipToObject(
    clip: AnimationClip,
    target: Object3D,
    options?: Record<string, unknown>,
  ): {
    clip: AnimationClip | null;
    coverage: number;
    matched: number;
    total: number;
    dropped: number;
    hipScale: number;
    face?: unknown;
  };
}
