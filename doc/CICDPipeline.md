Commit stage: unit tests
Acceptance stage: acceptance tests + e2e

E2E are expensive and tend to be flaky - we only have a few happy path E2E test. With acceptance and unit in place, the big missing piece is increasing confidence that the code actually runs in production environment and is stable.

We graudually iterating towards this mode: https://dojoconsortium.org/docs/testing/unit/