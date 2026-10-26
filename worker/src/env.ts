export interface WorkerEnv {
  DEPLOYMENT_ENV: 'local' | 'development' | 'preview' | 'production' | string;
  /** Development only: "true" uses recorded fixtures; "false" explicitly enables live Vitrasa. */
  UPSTREAM_FIXTURES?: string;
  /** Development fixture fault injection: "timeout" | "error" | "429" | source-specific cases. */
  UPSTREAM_FIXTURE_FAULT?: string;
}
