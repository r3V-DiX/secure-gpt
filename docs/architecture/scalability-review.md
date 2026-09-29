# Scalability review

Review date: **2026-09-28**

This review covers the FastAPI backend, browser extension, dashboard data fetching, database models and migrations, and checked-in deployment configuration. It is based on static code analysis, without load tests, production measurements, or inspection of the deployed database. Priorities reflect code-level risks, not measured capacity limits. No application changes were made as part of this review.

Client-side detection provides a useful foundation: additional users distribute detection work across their devices. The most significant scaling risks are in policy delivery, telemetry ingestion, and database access.

## Findings

### 1. Make policy delivery work across API instances — P1

**Evidence:** [extension_service.py](../../secure-gpt/backend/app/services/extension_service.py) stores subscribers in the process-local `_policy_subscribers` dictionary and uses unbounded queues. [policy-sync.ts](../../secure-gpt/packages/extension/src/background/policy-sync.ts) disables fallback polling while SSE is connected.

**Impact:** A policy saved through instance A cannot notify an extension connected to instance B. An extension can remain connected but stale. Slow subscribers can also accumulate queued updates.

**Recommended improvements:** Introduce shared publish/subscribe, bounded subscriber queues, and periodic policy-version reconciliation. Keep the database as the policy source of truth and fetch the current version on reconnect. Add exponential reconnect backoff with jitter instead of the fixed five-second retry interval.

Redis Pub/Sub can distribute notifications, but it provides at-most-once delivery; reconciliation is necessary to recover missed updates. See the [Redis Pub/Sub documentation](https://redis.io/docs/latest/develop/pubsub/).

### 2. Move document processing out of the API event loop — P1

**Evidence:** [redaction.py](../../secure-gpt/backend/app/api/v1/redaction.py) calls synchronous PDF and Office processing directly inside async handlers. Its `BackgroundTasks` calls only perform cleanup. Uploads are also read completely into memory.

**Impact:** Rendering and document processing can delay unrelated requests handled by the same worker. Concurrent large uploads increase memory and temporary-storage pressure.

**Recommended improvements:** Offload processing to a bounded worker pool initially. If document volume warrants it, use separately scalable job workers. Add application-level file/page limits, execution deadlines, concurrency limits, and reliable cleanup. Preserve the existing redaction guarantees when changing execution or rendering behavior.

An async handler does not automatically offload synchronous helper calls. See [FastAPI concurrency documentation](https://fastapi.tiangolo.com/async/).

### 3. Make telemetry genuinely batched and safe to retry — P1

**Evidence:** In [log-batcher.ts](../../secure-gpt/packages/extension/src/background/log-batcher.ts), `queueLog()` immediately flushes each new event. Newly queued events are persisted only after the network attempt; the unauthenticated early return does not persist them. The serialized queue also includes network waiting. In [extension_service.py](../../secure-gpt/backend/app/services/extension_service.py), ingestion performs one duplicate lookup per event before inserting.

**Impact:** Normal traffic can generate one request per event despite the batching interface. Service-worker termination during a send leaves a loss window. Concurrent retries can pass the duplicate check and then collide with the unique constraint, failing the transaction.

**Recommended improvements:** Persist events before sending, flush by elapsed time or batch size, and separate durable queue mutations from network waiting while preserving correctness. Add retry backoff, bounded storage, and an explicit overflow policy with observable loss accounting. Replace per-event duplicate checks with bulk inserts using `ON CONFLICT DO NOTHING`, preserving accurate inserted/duplicate counts.

See [SQLAlchemy PostgreSQL upsert support](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#insert-on-conflict-upsert).

### 4. Aggregate dashboard metrics in PostgreSQL and reduce polling — P2

**Evidence:** [log_analytics.py](../../secure-gpt/backend/app/api/v1/log_analytics.py) fetches every matching timestamp and groups them in Python. Entity counts examine only 10,000 rows. [use-dashboard.ts](../../secure-gpt/packages/secure-gpt-dashboard/src/features/dashboard/hooks/use-dashboard.ts) refreshes every five seconds; [use-event-log.ts](../../secure-gpt/packages/secure-gpt-dashboard/src/features/event-log/hooks/use-event-log.ts) also polls the first page every five seconds.

**Impact:** Analytics transfer and process more data as history grows, while entity totals become incomplete beyond the cap. For illustration, 1,000 open dashboards produce roughly 200 dashboard requests per second before other traffic; this is arithmetic, not a measured workload.

**Recommended improvements:** Group daily and entity totals in SQL, avoid redundant aggregate queries, and use short-lived caches scoped to the caller's authorized data and filters. Make polling visibility-aware, prevent overlapping requests, and cancel obsolete requests. Introduce daily summary tables once measurements justify them and the acceptable freshness window is agreed.

### 5. Design audit-log queries for growing history — P2

**Evidence:** [logs.py](../../secure-gpt/backend/app/api/v1/logs.py) uses exact counts and offset pagination. CSV export loads all matching ORM objects and builds the complete CSV in memory before returning a `StreamingResponse`. The checked-in [audit_log.py](../../secure-gpt/backend/app/models/audit_log.py) lacks composite indexes matching tenant/user and time filtering; deployed indexes were not inspected.

**Impact:** Deep pages and repeated exact counts become expensive as history grows. Export memory usage grows with the result set despite the streaming response type.

**Recommended improvements:** Check query plans and add indexes aligned with actual filters and ordering, such as user plus received time and ID, or organization plus event time. Introduce cursor pagination with a stable timestamp-plus-ID order, updating dashboard consumers accordingly. Produce exports in bounded chunks with explicitly managed database-session lifetimes. Establish retention/archive requirements before considering time partitioning.

Streaming dependency cleanup is version-sensitive: the repository pins FastAPI 0.115.0. Do not assume a request-scoped database dependency remains usable inside a streaming generator. See [FastAPI dependency and streaming lifecycle documentation](https://fastapi.tiangolo.com/advanced/advanced-dependencies/).

### 6. Reduce authentication writes and query waterfalls — P2

**Evidence:** [session_service.py](../../secure-gpt/backend/app/services/session_service.py) issues a session activity update for every valid authenticated request. [database.py](../../secure-gpt/backend/app/core/database.py) leaves commits to routes, so read routes do not provide a consistent persistence path for those updates. [orgs.py](../../secure-gpt/backend/app/api/v1/orgs.py) performs one member-count query per department.

**Impact:** Session updates create unnecessary database work and contention between requests sharing a session, even when eventually rolled back. Department query count grows linearly with the number of departments.

**Recommended improvements:** Coalesce activity updates and give them explicit transaction ownership while preserving immediate revocation checks. Replace per-department counts with one grouped query that also returns departments with zero members. Measure authentication query count and row-lock waits before introducing session caching.

### 7. Prepare shared state and connection budgets before adding replicas — P1 prerequisite

**Evidence:** [ratelimit.py](../../secure-gpt/backend/app/core/ratelimit.py) does not configure shared limiter storage. [database.py](../../secure-gpt/backend/app/core/database.py) permits 10 pooled connections plus 20 overflow connections per process. [main.py](../../secure-gpt/backend/app/main.py) creates missing tables and seeds/synchronizes releases during each worker's startup; `/health` returns static application metadata.

**Impact:** Rate limits are independent across processes. Replicas and workers multiply potential database connections: budget up to `30 × total API processes`, plus migrations, jobs, and other database clients. Concurrent startup couples serving capacity to schema and seed operations. Static health does not establish dependency readiness.

**Recommended improvements:** Configure shared rate limiting and explicit connection budgets, reserve database capacity for operational tasks, and measure pool wait time. Run migrations and seeding as controlled deployment steps. Add readiness checks, graceful shutdown, and SSE draining/reconnection behavior before scaling out. One worker per container can remain appropriate when containers themselves are replicated.

SlowAPI defaults to memory storage when no storage URL is supplied. See the [SlowAPI implementation](https://github.com/laurentS/slowapi/blob/master/slowapi/extension.py) and [Redis storage example](https://github.com/laurentS/slowapi/blob/master/docs/examples.md).

### 8. Isolate concurrent document jobs inside the extension — P2

**Evidence:** [offscreen.ts](../../secure-gpt/packages/extension/src/offscreen/offscreen.ts) stores PDF state in one global `lastPdfPages` array, which later supplies redaction-region calculations.

**Impact:** Another PDF can overwrite the state needed by a prior document. Multi-tab or overlapping processing can therefore associate regions with the wrong document. Large document state also remains resident until replaced.

**Recommended improvements:** Key processing and region requests by document/job ID. Bound processing concurrency and retained state, support cancellation, and explicitly release document resources after completion or failure. Return an explicit error for expired or unknown jobs.

## Suggested implementation order

1. Establish baseline latency, memory, query counts, and correctness checks for representative workloads.
2. Address findings 1–3: cross-instance policy delivery, isolated document processing, and durable bulk telemetry.
3. Complete finding 7 before increasing API replicas or worker counts.
4. Address findings 4–6: SQL aggregation, controlled polling, indexed historical queries, bounded exports, and reduced database writes.
5. Address finding 8 before supporting overlapping document workflows; raise its priority if multi-tab document processing is already common.
6. Re-measure after each change. Adopt summary tables, partitioning, or dedicated job infrastructure only when workload measurements and operational requirements justify them.

## Validation and load-testing scenarios

Use synthetic data in an isolated environment. Production targets, tenant sizes, telemetry rates, retention periods, document sizes, and freshness requirements have not been supplied; agree these before setting capacity or latency acceptance thresholds.

| Scenario | Validate |
| --- | --- |
| SSE clients distributed across at least two API instances | A policy changed through either instance reaches the correct clients; missed notifications reconcile after reconnect; slow clients do not create unbounded queues. |
| Replica restart and shared notification outage | Clients reconnect with jitter, recover current policy, and do not create a synchronized retry spike. |
| Concurrent telemetry batches and repeated event IDs | One stored event per ID, accurate response counts, no unique-constraint failures, and bounded queries per batch. |
| Extension offline periods and service-worker termination during sends | Persisted events survive restart; retries do not duplicate records; overflow behavior is explicit and observable. |
| Concurrent PDF/Office processing alongside ordinary API traffic | Ordinary requests remain responsive; memory, temporary storage, and worker concurrency stay bounded; redaction behavior remains correct. |
| Large audit history, including more than 10,000 events | Complete aggregate totals, efficient query plans, stable cursor traversal, and bounded-memory exports. |
| Many dashboard viewers, including hidden tabs and slow responses | Hidden tabs reduce polling, requests do not overlap, and caches preserve authorization boundaries. |
| Concurrent requests sharing one session; organizations with many departments | Lower activity-write frequency and lock waits, correct revocation behavior, and constant department query count. |
| Two overlapping PDF jobs from different tabs | Each region response belongs to its document; cancellation and completion release retained state. |
| Increased replica count and rolling deployment | Shared rate limits remain consistent, database connections stay within budget, readiness reflects dependencies, and migrations do not race. |

Track p50/p95/p99 API latency, error rates, event-loop lag, process memory, database query time and pool waits, session row-lock waits, active SSE connections, policy propagation delay, telemetry retry/queue depth, and document-job duration.

The inspected [backend CI workflow](../../.github/workflows/backend-ci.yml) builds and pushes images but does not run tests or performance checks. Add correctness gates and a repeatable load-test workflow before using scaling changes to claim higher capacity. Record dataset size, concurrency, hardware, cache state, and before/after results so comparisons are reproducible.
