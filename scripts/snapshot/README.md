# Schedule Snapshot Pipeline

Update the human-readable files under `scripts/snapshot/source/`, run
`npm run snapshot:generate`, validate the generated JSON, and review dataset
validity dates before committing the generated data under
`scripts/snapshot/generated/`.

The generated schedules are a dated, non-exhaustive migration snapshot. They
are not evidence of live municipal service and must not be presented as a
current complete timetable. Keep the source inputs and generated artifacts
until weekday, Saturday, and Sunday/holiday coverage and parity are verified.

Snapshot files contain only public schedule data and no user-specific
information.
