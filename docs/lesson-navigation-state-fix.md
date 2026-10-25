# Lesson navigation state fix

`DomainUnitView` now renders only content matching the requested canonical topic. It unmounts the previous lesson immediately during loading instead of hiding it, and keys `UnitView` by `unit.id`. Existing load cleanup continues to ignore obsolete promises. Unknown topic IDs no longer compare as ready when no content exists.

`UnitView` keys its coding editor by `codingChallenge.id` and clears assessment mode/title when unmounted. Topic changes therefore reset local tabs, editor code/results/hints/assistance state, exercise answer maps, completion errors and the quiz modal. Firebase progress and history are not reset or changed by this UI cleanup.

`CodeChallengeEditor` aborts its pending request on unmount or mode change. A request-identity guard checks whether a response is still current before updating results, errors, loading state or success callbacks. It also handles responses whose JSON decoding finishes late and fetch mocks/providers that ignore abort. Aborting the browser request does not undo a submission already processed by the server or delete its legitimate saved progress.

Eight interactive React component regression tests cover Continue with/without prior execution, independently keyed challenge replacement, exercise/quiz/assessment reset while loading, late JSON success, late fetch failure, ordinary tab switching, mode changes during evaluation, out-of-order lesson loads and retry after load failure. Tests use React's matching 19.3.0 test renderer, with network/persistence calls mocked; they are not a browser end-to-end run. The renderer and its types are development-only dependencies. No existing runtime dependency version was changed.

Validation: all 250 tests across 22 files, TypeScript checking and production build pass. The existing Vite chunk-size warning remains. No deployment was performed.

Changed files: `src/components/DomainUnitView.tsx`, `src/components/UnitView.tsx`, `src/components/CodeChallengeEditor.tsx`, `tests/lessonNavigation.test.tsx`, `package.json`, `package-lock.json`, and this document. Firebase security, grading logic, Vercel Sandbox infrastructure and billing configuration were not modified.
