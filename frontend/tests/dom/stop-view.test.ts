// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderStopArrivals } from '../../src/ui/stop/stop-arrivals-view';
import { setDocumentLanguage, translate } from '../../src/i18n';
import type { StopArrivalsResult } from '../../src/application/get-stop-arrivals';
import type { Language } from '../../src/domain/types';

const stop = {
  id: 'stop-1001',
  code: 'municipal-1001',
  vitrasaId: '1001',
  name: 'Central',
  lat: 42.2,
  lon: -8.7,
  lineIds: []
};

function result(dataStatus: StopArrivalsResult['dataStatus']): StopArrivalsResult {
  return {
    stop,
    arrivals: [],
    source: dataStatus === 'unavailable' ? 'unavailable' : 'live',
    dataStatus,
    fetchedAt: ''
  };
}

describe('arrivals privacy disclosure', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it.each(['es', 'gl', 'en'] as const)('renders localized disclosure in %s', (language: Language) => {
    setDocumentLanguage(language);
    const root = document.createElement('main');
    renderStopArrivals(root, result('loading'));
    const notice = root.querySelector('[data-arrivals-privacy]');

    expect(notice).toBeTruthy();
    expect(notice?.textContent).toBe(translate(language, 'arrivalsPrivacyNotice'));
    expect(notice?.textContent).toContain('Cloudflare');
    expect(notice?.textContent).toContain('Vitrasa');
  });
});

describe('privacy disclosure content', () => {
  it.each([
    ['es', ['identificador', 'metadatos de conexión', 'cuenta', 'perfil', 'anónima']],
    ['gl', ['identificador', 'metadatos da conexión', 'conta', 'perfil', 'anónima']],
    ['en', ['public ID', 'connection metadata', 'account', 'profile', 'anonymous']]
  ] as const)('covers all required facts in %s', (language, requiredPhrases) => {
    const notice = translate(language, 'arrivalsPrivacyNotice').toLowerCase();
    for (const phrase of requiredPhrases) expect(notice).toContain(phrase.toLowerCase());
  });
});