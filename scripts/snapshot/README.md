# Schedule Snapshot Pipeline

Update the human-readable files under `scripts/snapshot/source/`, run `npm run snapshot:generate`, validate the generated JSON, and review dataset validity dates before committing `worker/src/schedule-data/`. The frontend gets schedule data only through the Worker API; generated schedules are not published as frontend static files.

The generated manifest is the freshness label shown in the UI. Snapshot files
must contain only public schedule data and no user-specific information.
