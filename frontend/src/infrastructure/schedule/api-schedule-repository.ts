import type { ScheduleRepository } from '../../application/ports';
import type { DatasetManifest, Line, LineDetails, Stop } from '../../domain/types';

type JsonFetcher = (input: string) => Promise<Response>;

interface CatalogResponse {
  scheduleMetadata: DatasetManifest;
  lines: Array<Pick<Line, 'id' | 'code' | 'name'> & { color: string | null }>;
}

interface StopsResponse {
  stops: Stop[];
}

interface LineDetailResponse {
  timetable?: LineDetails['timetable'];
  patterns?: LineDetails['patterns'];
}

export class ApiScheduleRepository implements ScheduleRepository {
  private catalogRequest?: Promise<CatalogResponse>;
  private stopsRequest?: Promise<Stop[]>;
  private readonly lineDetailRequests = new Map<string, Promise<LineDetails>>();

  constructor(
    private readonly apiBaseUrl: string,
    private readonly fetcher: JsonFetcher = (input) => fetch(input)
  ) {}

  async getManifest(): Promise<DatasetManifest> {
    return (await this.getCatalog()).scheduleMetadata;
  }

  async listLines(): Promise<Line[]> {
    const { lines } = await this.getCatalog();
    return lines.map((line) => ({ ...line, color: line.color ?? '#666666' }));
  }

  async listStops(): Promise<Stop[]> {
    this.stopsRequest ??= this.fetchJson<StopsResponse>('/stops').then(({ stops }) => stops);
    return this.stopsRequest;
  }

  getLineDetails(lineId: string): Promise<LineDetails> {
    let request = this.lineDetailRequests.get(lineId);
    if (!request) {
      request = this.fetchLineDetails(lineId);
      this.lineDetailRequests.set(lineId, request);
    }
    return request;
  }

  private async getCatalog(): Promise<CatalogResponse> {
    this.catalogRequest ??= this.fetchJson<CatalogResponse>('/lines');
    return this.catalogRequest;
  }

  private async fetchLineDetails(lineId: string): Promise<LineDetails> {
    const line = (await this.listLines()).find((candidate) => candidate.id === lineId);
    if (!line) throw new Error(`Unknown line: ${lineId}`);
    const response = await this.fetcher(this.url(`/lines/${encodeURIComponent(line.code)}`));
    if (response.status === 404) return { patterns: [] };
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    const details = await response.json() as LineDetailResponse;
    return { timetable: details.timetable, patterns: details.patterns ?? [] };
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await this.fetcher(this.url(path));
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  private url(path: string): string {
    return `${this.apiBaseUrl.replace(/\/$/, '')}${path}`;
  }
}