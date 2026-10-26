import type { VisibilityPort } from '../../application/ports';

export class DocumentVisibility implements VisibilityPort {
  get visible(): boolean {
    return document.visibilityState === 'visible';
  }

  onVisibilityChange(listener: (visible: boolean) => void): () => void {
    const handler = () => listener(this.visible);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }
}
