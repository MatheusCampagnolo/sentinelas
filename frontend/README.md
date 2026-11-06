# Dashboard

The Sentinelas web application, built with Next.js App Router, TypeScript, and Tailwind CSS. Start it from the repository root using the commands in the [root README](../README.md).

Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` to the API base URL. The browser app appends `/dispositivos` and polls it every five seconds. This public variable must contain only the URL, never an API key or webhook secret.

See [system architecture](../docs/architecture.md) for the route, map, and data-flow behavior. See [AWS backend](../docs/aws-backend.md) for CORS and API response details.
