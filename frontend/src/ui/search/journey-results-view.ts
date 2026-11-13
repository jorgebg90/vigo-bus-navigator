import { sortTransitJourneys, type JourneyPlace } from '../../domain/transit-journey';
import { translateCurrent } from '../../i18n';
import type { JourneySearchViewOptions } from './journey-search-view';

export function renderJourneyResults(root: HTMLElement, options: JourneySearchViewOptions): void {
  root.dataset.journeyOptions = 'true';
  const journeys = options.outcome?.options ?? [];
  root.className = 'journey-results';
  if (!journeys.length) {
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.dataset.journeyDataStatus = 'empty';
    status.textContent = translateCurrent('journeyNoResults');
    root.append(status);
    return;
  }
  const heading = document.createElement('h2');
  heading.textContent = translateCurrent('journeyResults');
  const sortLabel = document.createElement('label');
  sortLabel.textContent = translateCurrent('journeySort');
  const sort = document.createElement('select');
  sort.dataset.journeySort = 'true';
  for (const [value, key] of [
    ['arrival', 'journeySortArrival'], ['transfers', 'journeySortTransfers'], ['walking', 'journeySortWalking']
  ] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = translateCurrent(key);
    sort.append(option);
  }
  sortLabel.append(sort);
  const list = document.createElement('div');
  list.className = 'journey-options';
  const more = document.createElement('button');
  more.type = 'button';
  more.textContent = translateCurrent('journeyMoreOptions');
  more.dataset.journeyMore = 'true';
  let expanded = false;
  let selected = options.selectedJourneyId ?? journeys[0].id;
  const update = () => {
    list.replaceChildren();
    const by = sort.value === 'transfers' ? 'transfers' : sort.value === 'walking' ? 'walking' : 'arrival';
    const ordered = sortTransitJourneys(journeys, by);
    more.hidden = expanded || ordered.length <= 3;
    for (const journey of expanded ? ordered : ordered.slice(0, 3)) {
      const article = document.createElement('article');
      article.className = 'journey-option';
      article.dataset.journeyOption = journey.id;
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.className = 'journey-option-select';
      choose.dataset.journeyOptionSelect = journey.id;
      choose.setAttribute('aria-pressed', String(selected === journey.id));
      const title = document.createElement('strong');
      title.textContent = translateCurrent('journeyOptionTitle', {
        departure: journeyTime(journey.startTime), arrival: journeyTime(journey.endTime)
      });
      const route = document.createElement('span');
      route.className = 'journey-route-chain';
      route.textContent = journey.legs.map((leg) => leg.mode === 'BUS'
        ? translateCurrent('journeyBusLine', { line: leg.line })
        : translateCurrent('journeyWalkShort')).join(' → ');
      const summary = document.createElement('span');
      summary.textContent = translateCurrent('journeyTransitSummary', {
        minutes: Math.ceil(journey.durationSeconds / 60),
        transfers: journey.transfers, walking: Math.ceil(journey.walkingSeconds / 60)
      });
      choose.append(title, route, summary);
      choose.addEventListener('click', () => {
        selected = journey.id;
        options.onJourneySelect?.(journey);
        update();
        list.querySelector<HTMLButtonElement>(`[data-journey-option-select="${journey.id}"]`)?.focus({ preventScroll: true });
      });
      article.append(choose);
      if (selected === journey.id) {
        const detail = document.createElement('ol');
        detail.className = 'journey-directions';
        detail.dataset.journeyDirections = journey.id;
        for (const [legIndex, leg] of journey.legs.entries()) {
          const item = document.createElement('li');
          item.dataset.journeyLeg = leg.mode;
          const label = document.createElement('strong');
          label.textContent = leg.mode === 'BUS'
            ? `${translateCurrent('journeyBusLine', { line: leg.line })}${leg.headsign ? ` · ${leg.headsign}` : ''}`
            : translateCurrent('journeyWalkTo', {
              destination: legIndex === journey.legs.length - 1 ? options.destinationLabel || leg.to.name : leg.to.name
            });
          const timing = document.createElement('p');
          timing.textContent = `${journeyTime(leg.startTime)}–${journeyTime(leg.endTime)} · ${Math.ceil(leg.durationSeconds / 60)} min`;
          item.append(label, timing);
          const previous = journey.legs[legIndex - 1];
          if (previous && leg.startTime - previous.endTime >= 60_000) {
            const wait = document.createElement('p');
            wait.textContent = translateCurrent('journeyWait', { minutes: Math.ceil((leg.startTime - previous.endTime) / 60_000) });
            item.prepend(wait);
          }
          if (leg.mode === 'BUS') {
            appendPlace(item, leg.from, options);
            const stops = document.createElement('details');
            const stopsLabel = document.createElement('summary');
            stopsLabel.textContent = translateCurrent('journeyIntermediateStops', { count: leg.intermediateStops.length });
            stops.append(stopsLabel);
            for (const stop of leg.intermediateStops) appendPlace(stops, stop, options);
            item.append(stops);
            appendPlace(item, leg.to, options);
            const basis = document.createElement('small');
            basis.textContent = translateCurrent(leg.realTime ? 'journeyOtpRealtime' : 'journeyOtpScheduled');
            item.append(basis);
          } else {
            const distance = document.createElement('p');
            distance.textContent = translateCurrent('journeyApproxDistance', { meters: Math.round(leg.distanceMeters) });
            item.append(distance);
            if (leg.steps.length) {
              const steps = document.createElement('details');
              const summary = document.createElement('summary');
              summary.textContent = translateCurrent('journeyWalkingDirections');
              const instructions = document.createElement('ol');
              instructions.className = 'journey-walking-steps';
              const walkingSteps: Array<{ label: string; distanceMeters: number }> = [];
              for (const step of leg.steps) {
                const street = step.street.trim();
                const genericLabels = {
                  sidewalk: 'journeyWalkSidewalk', footway: 'journeyWalkPath',
                  path: 'journeyWalkPath', steps: 'journeyWalkStairs',
                  '': 'journeyWalkContinue'
                } as const;
                const generic = Object.hasOwn(genericLabels, street.toLowerCase())
                  ? genericLabels[street.toLowerCase() as keyof typeof genericLabels] : null;
                const stepLabel = generic
                  ? translateCurrent(generic)
                  : translateCurrent('journeyWalkStreet', { street });
                const previousStep = walkingSteps[walkingSteps.length - 1];
                if (previousStep?.label === stepLabel) previousStep.distanceMeters += step.distanceMeters;
                else walkingSteps.push({ label: stepLabel, distanceMeters: step.distanceMeters });
              }
              for (const step of walkingSteps) {
                const instruction = document.createElement('li');
                const action = document.createElement('span');
                action.textContent = step.label;
                const distance = document.createElement('span');
                distance.className = 'journey-step-distance';
                distance.textContent = translateCurrent('journeyStepDistance', { meters: Math.round(step.distanceMeters) });
                instruction.append(action, distance);
                instructions.append(instruction);
              }
              steps.append(summary, instructions);
              item.append(steps);
            }
          }
          detail.append(item);
        }
        article.append(detail);
      }
      list.append(article);
    }
  };
  more.addEventListener('click', () => { expanded = true; update(); });
  sort.addEventListener('change', () => { expanded = true; update(); });
  root.append(heading, sortLabel, list, more);
  update();
}

function appendPlace(parent: HTMLElement, place: JourneyPlace, options: JourneySearchViewOptions): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'journey-place';
  button.dataset.journeyPlace = place.stopId ?? place.name;
  button.textContent = place.name;
  button.addEventListener('click', () => options.onPlaceSelect?.(place));
  parent.append(button);
}

function journeyTime(timestamp: number): string {
  return new Intl.DateTimeFormat(document.documentElement.lang || 'es', {
    timeZone: 'Europe/Madrid', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(timestamp);
}
