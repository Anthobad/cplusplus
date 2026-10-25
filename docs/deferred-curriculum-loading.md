# Deferred curriculum and supporting content

Priority 5 reduces the JavaScript needed for the initial roadmap. Lesson bodies are loaded by domain; exams, reference docs, the AI mentor, readiness, mock interviews and optional interview practice load when opened.

| Initial JavaScript | Before | After |
| --- | ---: | ---: |
| Uncompressed | 1,885.98 kB | approximately 1,003 kB |
| Gzip | 530.48 kB | approximately 265 kB |

These local production-build measurements cover the entry and its static JavaScript dependencies, excluding CSS and deferred imports. They indicate approximately 47% less initial JavaScript and 50% less gzip transfer. They are not deployed network-latency or browser-rendering measurements. Opening a feature incurs its first chunk request; opening every feature eventually downloads its content. The main bundle still exceeds Vite's 500 kB warning threshold, largely because the app shell and existing authentication/persistence dependencies remain available at startup. The warning has not been suppressed.

## Authoring and asset generation

The authoritative 39 lessons remain in the existing curriculum content modules. `scripts/generate-curriculum-assets.ts` composes that content into a lightweight index and four domain JSON assets under ignored `src/generated/curriculum/`. This avoids maintaining a second authored curriculum. The index contains roadmap labels, stable topic/quiz/challenge IDs, quiz thresholds and exam metadata, but no lesson bodies, quiz questions, or exam questions.

`npm run dev`, `npm run build`, `npm test` and `npm run lint` regenerate assets through their pre-hooks. For direct `vitest`, `tsc` or Vite commands on a fresh checkout, first run `npm run generate:curriculum`. After editing authored curriculum while a dev server is already running, regenerate the assets and reload the page, or restart `npm run dev`. Generated files are atomically replaced only when their content changes. Existing Vite HMR/watch settings are unchanged.

`src/data/curriculumSummary.ts` supplies the lightweight data used by navigation, progress migration, roadmap and readiness analytics. `src/data/createCurriculum.ts` supplies the shared lookup, gate, prerequisite, migration and next-step rules. The full `curriculum.ts` exports retain their full-content contract for authoring, scripts and existing tests. The browser does not statically import that full content graph.

## Loading behavior

`loadCurriculum.ts` selects a domain from the topic metadata, loads it once, and shares its pending/successful promise for later topics in that domain. Failed loads are not kept in the application cache. Canonical, week and legacy topic aliases remain supported.

`DomainUnitView` displays a loading state and discards results from requests whose topic was replaced or whose view was left. While another topic loads, an existing lesson instance stays mounted but hidden and inert, preserving the original component's tab/state behavior without displaying the previous topic as the new one. A lesson-load failure offers retry and a return to the roadmap. If the browser caches an import failure or an older deployment refers to removed chunks, reload the page.

Other deferred views use an accessible loading state and an error boundary with a page-reload action. Docs/mentor loading states are visible overlays with a close action. Once first opened, these tools remain mounted when closed so searches, selections and chat history retain their existing in-session behavior. Authentication and progress persistence continue through the existing modules. Loading failures do not award completion or save an exam result.

The changes do not alter lesson text, exercises, IDs, thresholds, scoring, progression, saved history, API routes, sandbox/compiler configuration or deployment settings. The optional track from priority 4 remains separate from curriculum progress. No deployment was performed.

## Verification

The new loading tests compare generated metadata and all four full domains to authored content, cover alias lookup, shared loads, failed-load retry, and compare progression decisions across all 40 completion prefixes and 16 combinations of passed exams. Existing curriculum, migration, readiness, grading and real-compiler tests continue to apply.

All 210 tests pass, along with TypeScript checking, the production build and bundle-structure checks. The final build measures 1,003.17 kB initial JavaScript and 265.25 kB gzip.

The production build runs `npm run check:bundle`. This checks the Vite manifest's complete static dependency graph to ensure all four domain assets and supporting views remain deferred, reports actual initial JavaScript/gzip sizes, and enforces a 350 kB initial gzip regression budget. It does not hide Vite warnings. This verification is automated/local; interactive browser and deployed-production performance have not been measured in this revision.
