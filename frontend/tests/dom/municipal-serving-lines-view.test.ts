// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setDocumentLanguage } from '../../src/i18n';
import { renderServingLines } from '../../src/ui/stop/serving-lines-view';

describe('municipal serving-lines view', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it('uses a concise heading and renders lines without list bullets', () => {
    const root = document.createElement('section');
    renderServingLines(root, {
      kind: 'success',
      value: {
        lines: [{ id: 'A', code: 'A', name: 'University - Airport', color: '#007FFF' }],
        provenance: { kind: 'municipal', sourceName: 'Vigo municipal JSP' }
      }
    }, vi.fn());

    expect(root.querySelector('h2')?.textContent).toBe('Lines');
    expect(root.querySelector('[data-serving-lines-list]')?.getAttribute('aria-label')).toBe('Lines');
    expect(root.querySelector('[data-serving-lines-source]')).toBeNull();
    expect(root.querySelector('[data-serving-lines-list] [data-serving-line]')?.classList.contains('line-list-item')).toBe(true);
    expect(root.querySelector('[data-serving-lines-list] [data-serving-line]')?.textContent)
      .toContain('University - Airport');
  });

  it('labels provisional line-stop details and renders published times', () => {
    const root = document.createElement('section');
    renderServingLines(root, {
      kind: 'success',
      value: {
        lines: [{ id: 'A', code: 'A', name: 'Line A', color: '#007FFF' }],
        provenance: { kind: 'fixture', sourceName: 'Synthetic serving-lines fixture' }
      }
    }, vi.fn(), [{
      municipalCode: '2789',
      lineCode: 'A',
      patterns: [{
        tripId: 'A  02LP000_008002_4',
        shapeId: 'Route_1003',
        direction: 'PEINADOR - AEROPORTO',
        departureTimes: ['08:00', '08:15']
      }],
      provenance: {
        kind: 'provisional-fixture',
        sourceName: 'Synthetic provisional line-stop evaluation fixture',
        evidenceRef: 'spec.md#FR-026'
      }
    }]);

    expect(root.querySelector('[data-line-stop-detail="A"]')?.textContent).toContain('08:00, 08:15');
    expect(root.querySelector('[data-provisional-warning]')?.textContent)
      .toBe('Provisional data — inferred and not verified by the provider.');
    expect(root.querySelector('[data-line-stop-source]')?.textContent)
      .toBe('Provisional fixture source: Synthetic provisional line-stop evaluation fixture');
  });
});
