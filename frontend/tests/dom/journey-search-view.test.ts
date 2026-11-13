// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderJourneySearch } from '../../src/ui/search/journey-search-view';
import { setDocumentLanguage } from '../../src/i18n';
import type { JourneySearchOutcome } from '../../src/application/search-journeys';
import type { AddressSuggestion } from '../../src/domain/journey-address';
import { readFile } from 'node:fs/promises';
import { OtpRoutePlanner } from '../../src/infrastructure/routing/otp-route-planner';
import { renderJourneyResults } from '../../src/ui/search/journey-results-view';

beforeEach(() => {
  vi.useRealTimers();
  setDocumentLanguage('en');
});

describe('journey search view', () => {
  it.each([
    ['es', 'Camina por la acera', 'Sigue el camino peatonal', 'Camina por Avenida da Gran Vía', 'Durante 97 m'],
    ['gl', 'Camiña pola beirarrúa', 'Segue o camiño peonil', 'Camiña por Avenida da Gran Vía', 'Durante 97 m'],
    ['en', 'Walk along the sidewalk', 'Follow the footpath', 'Walk along Avenida da Gran Vía', 'For 97 m']
  ] as const)('presents understandable walking instructions in %s without duplicate path fragments', async (language, sidewalk, path, street, distance) => {
    setDocumentLanguage(language);
    const payload: unknown = JSON.parse(await readFile('specs/example.json', 'utf8'));
    const result = await new OtpRoutePlanner(async () => Response.json(payload)).plan({
      origin: { latitude: 42.23419, longitude: -8.71358 },
      destination: { latitude: 42.22151, longitude: -8.7327 },
      departureLocal: '2026-11-13T15:53'
    });
    if (result.kind !== 'success') throw new Error('Expected decoded fixture');
    const journey = result.journeys[0];
    const walk = journey.legs.find((leg) => leg.mode === 'WALK');
    if (!walk) throw new Error('Expected walking leg');
    walk.steps = [
      { street: 'sidewalk', distanceMeters: 110 },
      { street: 'path', distanceMeters: 93 },
      { street: 'path', distanceMeters: 4 },
      { street: 'Avenida da Gran Vía', distanceMeters: 33 }
    ];
    const root = document.createElement('div');
    renderJourneyResults(root, {
      origin: null, destination: null, originLabel: '', destinationLabel: '',
      departureLocal: '2026-11-13T15:53',
      outcome: { status: 'complete', reason: null, options: [journey], originCandidates: [], destinationCandidates: [] },
      selectedOriginStopId: null, selectedDestinationStopId: null, notice: null,
      onSwapEndpoints: vi.fn(), onAddressEdit: vi.fn(),
      onAddressSearch: async () => ({ kind: 'success', suggestions: [] }),
      onAddressSelect: vi.fn(), onCandidateSelect: vi.fn(), onUseLocation: vi.fn(), onSearch: vi.fn()
    });
    const instructions = root.querySelector('.journey-walking-steps');
    expect(instructions?.querySelectorAll('li')).toHaveLength(3);
    expect([...instructions!.querySelectorAll('li > span:first-child')].map((element) => element.textContent))
      .toEqual([sidewalk, path, street]);
    expect(instructions?.textContent).toContain(distance);
    expect([...instructions!.querySelectorAll('.journey-step-distance')].map((element) => element.textContent?.match(/\d+/)?.[0]))
      .toEqual(['110', '97', '33']);
  });

  it('renders actual alternatives, ordered directions, stop selection and additional options', async () => {
    const payload: unknown = JSON.parse(await readFile('specs/example.json', 'utf8'));
    const result = await new OtpRoutePlanner(async () => Response.json(payload)).plan({
      origin: { latitude: 42.23419, longitude: -8.71358 },
      destination: { latitude: 42.22151, longitude: -8.7327 },
      departureLocal: '2026-11-13T15:53'
    });
    if (result.kind !== 'success') throw new Error('Expected decoded fixture');
    const root = document.createElement('main');
    const onJourneySelect = vi.fn();
    const onPlaceSelect = vi.fn();
    renderJourneySearch(root, {
      origin: null, destination: null, originLabel: '', destinationLabel: '',
      departureLocal: '2026-11-13T15:53',
      outcome: { status: 'complete', reason: null, options: result.journeys, originCandidates: [], destinationCandidates: [] },
      selectedOriginStopId: null, selectedDestinationStopId: null, notice: null,
      onSwapEndpoints: vi.fn(), onAddressEdit: vi.fn(),
      onAddressSearch: async () => ({ kind: 'success', suggestions: [] }),
      onAddressSelect: vi.fn(), onCandidateSelect: vi.fn(), onUseLocation: vi.fn(), onSearch: vi.fn(),
      onJourneySelect, onPlaceSelect
    });
    expect(root.querySelectorAll('[data-journey-option-select]')).toHaveLength(3);
    expect(root.querySelector('[data-journey-directions]')?.textContent).toContain('Bus 4C');
    root.querySelector<HTMLButtonElement>('[data-journey-place]')?.click();
    expect(onPlaceSelect).toHaveBeenCalledOnce();
    root.querySelectorAll<HTMLButtonElement>('[data-journey-option-select]')[1].click();
    expect(onJourneySelect).toHaveBeenCalledWith(result.journeys[1]);
    expect(root.querySelector('[data-journey-directions]')?.textContent).toContain('Bus 11');
    root.querySelector<HTMLButtonElement>('[data-journey-more]')?.click();
    expect(root.querySelectorAll('[data-journey-option-select]')).toHaveLength(4);
    expect(root.textContent).toContain('Scheduled');
    expect(root.querySelector('.journey-privacy-note')?.textContent).toContain('municipal');
  });
  it('renders paired address fields, swapping, Madrid departure time, and current-location controls', () => {
    const root = document.createElement('main');
    const onSwapEndpoints = vi.fn();
    const onUseLocation = vi.fn();
    const onSearch = vi.fn();
    renderJourneySearch(root, {
      origin: null,
      destination: null,
      originLabel: 'Origin Street',
      destinationLabel: 'Destination Street',
      departureLocal: '2026-07-15T12:30',
      outcome: null,
      selectedOriginStopId: null,
      selectedDestinationStopId: null,
      notice: null,
      onSwapEndpoints,
      onAddressEdit: vi.fn(),
      onAddressSearch: vi.fn(async () => ({ kind: 'success' as const, suggestions: [] })),
      onAddressSelect: vi.fn(),
      onCandidateSelect: vi.fn(),
      onUseLocation,
      onSearch
    });

    expect(root.querySelector('h1')?.textContent).toBe('Plan your trip');
    expect(root.querySelector('[data-journey-mode]')?.textContent).toContain('Bus');
    expect(root.querySelectorAll('[data-journey-address]')).toHaveLength(2);
    expect(root.querySelectorAll('[data-journey-select]')).toHaveLength(0);
    expect(root.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.value).toBe('2026-07-15T12:30');
    root.querySelector<HTMLButtonElement>('[data-journey-swap]')?.click();
    root.querySelector<HTMLButtonElement>('[data-journey-use-location]')?.click();
    expect(onSwapEndpoints).toHaveBeenCalledOnce();
    expect(onUseLocation).toHaveBeenCalledOnce();
  });

  it('shows incomplete data and nearby candidates without presenting them as a complete result', () => {
    const root = document.createElement('main');
    const onCandidateSelect = vi.fn();
    const outcome: JourneySearchOutcome = {
      status: 'incomplete',
      reason: 'incomplete-data',
      options: [],
      originCandidates: [{
        stop: { id: 's1', code: '1', vitrasaId: '1', name: 'Origin stop', lat: 42.24, lon: -8.72, lineIds: [] },
        distanceMeters: 80,
        walkMinutes: 2
      }],
      destinationCandidates: []
    };
    renderJourneySearch(root, {
      origin: { latitude: 42.24, longitude: -8.72 },
      destination: { latitude: 42.25, longitude: -8.72 },
      originLabel: 'Origin Street',
      destinationLabel: 'Destination Street',
      departureLocal: '2026-07-15T12:30',
      outcome,
      selectedOriginStopId: null,
      selectedDestinationStopId: null,
      notice: null,
      onSwapEndpoints: () => undefined,
      onAddressEdit: () => undefined,
      onAddressSearch: async () => ({ kind: 'success', suggestions: [] }),
      onAddressSelect: () => undefined,
      onCandidateSelect,
      onUseLocation: () => undefined,
      onSearch: () => undefined
    });

    expect(root.querySelector('[data-journey-data-status="incomplete"]')?.textContent).toContain('not sufficient');
    expect(root.querySelector('[data-journey-candidate="s1"]')?.textContent).toContain('Origin stop');
    const candidateButton = root.querySelector<HTMLButtonElement>('[data-journey-candidate-select="s1"]');
    expect(candidateButton?.getAttribute('aria-pressed')).toBe('false');
    candidateButton?.click();
    expect(onCandidateSelect).toHaveBeenCalledWith('origin', outcome.originCandidates[0]);
    expect(root.querySelector<HTMLElement>('[data-journey-candidates="origin"]')?.className).toContain('journey-candidates');
    expect(root.querySelector('[data-journey-options]')).toBeNull();
    expect(root.textContent).toContain('available stop catalog');
    expect(root.querySelector('.journey-radius-note')).toBeNull();
    expect(root.querySelector<HTMLDetailsElement>('.journey-privacy-note')?.open).toBe(false);
  });

  it('debounces address input, renders accessible suggestions, and selects a point', async () => {
    vi.useFakeTimers();
    const root = document.createElement('main');
    const onAddressEdit = vi.fn();
    const suggestion: AddressSuggestion = {
      id: 'W/123',
      label: '2 Rúa do Príncipe, Vigo',
      point: { latitude: 42.24, longitude: -8.72 }
    };
    const onAddressSearch = vi.fn(async () => ({ kind: 'success' as const, suggestions: [suggestion] }));
    const onAddressSelect = vi.fn();
    renderJourneySearch(root, {
      origin: null,
      destination: null,
      originLabel: '',
      destinationLabel: '',
      departureLocal: '2026-07-15T12:30',
      outcome: null,
      selectedOriginStopId: null,
      selectedDestinationStopId: null,
      notice: null,
      onSwapEndpoints: vi.fn(),
      onAddressEdit,
      onAddressSearch,
      onAddressSelect,
      onCandidateSelect: vi.fn(),
      onUseLocation: vi.fn(),
      onSearch: vi.fn()
    });

    const input = root.querySelector<HTMLInputElement>('[data-journey-address="origin"]')!;
    input.value = 'Rúa do Príncipe';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onAddressEdit).toHaveBeenCalledWith('origin', 'Rúa do Príncipe');
    expect(root.querySelector<HTMLButtonElement>('[data-journey-search] button[type="submit"]')?.disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(350);
    expect(onAddressSearch).toHaveBeenCalledOnce();
    const option = root.querySelector<HTMLButtonElement>('[role="option"]');
    expect(option?.textContent).toBe(suggestion.label);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('[data-journey-address-status="origin"]')?.textContent).toBe('');
    expect(root.textContent).not.toContain('suggestions available');
    option?.click();
    expect(onAddressSelect).toHaveBeenCalledWith('origin', suggestion);
    expect(root.querySelector<HTMLAnchorElement>('.journey-privacy-note p a')?.href).toBe('https://planificador-rutas-api.vigo.org/attribution');
  });
});
