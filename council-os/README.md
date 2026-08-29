# Council OS compose — four services, then stop

A coding agent can run this. It is not a twelve-analyst swarm.

```sh
docker compose -f council-os/docker-compose.yml up --build
curl -sS http://localhost:8080/api/health
```

| Service | Role |
|---|---|
| **api** | Existing Node API (`api-server/`). Non-root `node`. |
| **postgres** | Persistence waiting. Non-root `postgres`. |
| **redis** | Cache / rate-limit waiting. Non-root `redis`. |
| **nginx** | Reverse proxy, `nginx-unprivileged`, port 8080. |

Healthchecks gate `depends_on`. Postgres and Redis are not exposed on the host.

This is the measurement API. It does not route models and it does not run an arena.
GSPC stays deterministic. No LLM-as-judge.

Measurement, not certification.
