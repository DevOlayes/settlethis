export type RunnerPerformanceSnapshot = {
  fps: number;
  averageFrameMs: number;
  worstFrameMs: number;
  slowFrames: number;
  slowFrameRatio: number;
  framesSampled: number;
};

export class RunnerPerformanceMonitor {
  private elapsed = 0;
  private frameCount = 0;
  private totalFrameMs = 0;
  private worstFrameMs = 0;
  private slowFrames = 0;

  record(deltaSeconds: number): void {
    const frameMs = deltaSeconds * 1000;
    this.elapsed += deltaSeconds;
    this.frameCount++;
    this.totalFrameMs += frameMs;
    this.worstFrameMs = Math.max(this.worstFrameMs, frameMs);
    if (frameMs > 33.33) this.slowFrames++;
  }

  takeSnapshot(): RunnerPerformanceSnapshot {
    const seconds = Math.max(this.elapsed, 0.001);
    const snapshot = {
      fps: Math.round(this.frameCount / seconds),
      averageFrameMs: Number((this.totalFrameMs / Math.max(1, this.frameCount)).toFixed(2)),
      worstFrameMs: Number(this.worstFrameMs.toFixed(2)),
      slowFrames: this.slowFrames,
      slowFrameRatio: Number((this.slowFrames / Math.max(1, this.frameCount)).toFixed(3)),
      framesSampled: this.frameCount,
    };
    this.elapsed = 0;
    this.frameCount = 0;
    this.totalFrameMs = 0;
    this.worstFrameMs = 0;
    this.slowFrames = 0;
    return snapshot;
  }
}
