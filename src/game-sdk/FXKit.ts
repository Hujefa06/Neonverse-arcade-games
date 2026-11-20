import { useStore } from '../store/useStore';

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

class FXKit {
  private activeShakeTimer: any = null;

  /** Triggers a directional screen shake on target container */
  triggerScreenShake(element: HTMLElement | null, intensity: number = 8, durationMs: number = 250) {
    if (!element) return;
    const { fxSettings } = useStore.getState();
    if (fxSettings.reducedMotion || fxSettings.lowFxMode) return;

    if (this.activeShakeTimer) clearInterval(this.activeShakeTimer);

    const startTime = performance.now();
    this.activeShakeTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= durationMs) {
        clearInterval(this.activeShakeTimer);
        element.style.transform = 'translate(0px, 0px)';
        return;
      }
      const progress = 1 - elapsed / durationMs;
      const currentIntensity = intensity * progress;
      const rx = (Math.random() * 2 - 1) * currentIntensity;
      const ry = (Math.random() * 2 - 1) * currentIntensity;
      element.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
    }, 16);
  }

  /** Trigger a lightning flash on container overlay */
  triggerLightningFlash(overlayEl: HTMLElement | null, color: string = '#00F0FF') {
    if (!overlayEl) return;
    const { fxSettings } = useStore.getState();
    if (fxSettings.reducedMotion) return;

    overlayEl.style.backgroundColor = color;
    overlayEl.style.opacity = '0.35';
    overlayEl.style.transition = 'opacity 0.05s ease-out';

    setTimeout(() => {
      overlayEl.style.transition = 'opacity 0.2s ease-in';
      overlayEl.style.opacity = '0';
    }, 50);
  }

  /** Slow-motion timescale hook */
  applySlowMotion(callback: (timeScale: number) => void, slowFactor: number = 0.3, durationMs: number = 400) {
    callback(slowFactor);
    setTimeout(() => {
      callback(1.0);
    }, durationMs);
  }
}

export const fxKit = new FXKit();
