export interface ClubConfig {
  name: string;
  urls: string[];
  aiHints: string;
}

export interface ScrapedEvent {
  title: string;
  club: string;
  date: string; // YYYY-MM-DD
  time: string | null;
  description: string | null;
  ticket_url: string | null;
}

export interface ScrapeResult {
  club: string;
  events: ScrapedEvent[];
  error?: string;
}

export interface ScrapeRunSummary {
  started_at: string;
  finished_at: string;
  results: ScrapeResult[];
  total_new_events: number;
}
