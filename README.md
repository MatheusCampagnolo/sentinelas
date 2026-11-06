# Sentinelas

Sentinelas is an academic IoT prototype for monitoring public drains and waste bins. An ESP32 measures the distance to the contents, AWS stores the current device state, and a web dashboard displays the monitored locations for a maintenance team.

## Current system

- **Sensor firmware:** ESP32 DevKit V1 + HC-SR04. It filters distance samples, estimates occupancy, and sends a JSON reading to AWS every two seconds.
- **AWS:** API Gateway HTTP API, three Lambda functions, SQS, and DynamoDB. The recorded end-to-end test is described in [AWS backend](docs/aws-backend.md).
- **Dashboard:** Next.js, TypeScript, Tailwind CSS, Leaflet, and OpenStreetMap. It reads `GET /dispositivos` every five seconds. The map and route planner use device coordinates; route planning uses public OSRM endpoints.
- **Scale model:** a second ESP32 polls the same devices endpoint and animates LEDs when the configured target device is critical.

This is a classroom demonstrator, not a production municipal service. The live AWS Lambda source is not yet versioned in this repository; see the [backend notes](backend/README.md).

## Run the dashboard

Requirements: Node.js 20.9 or newer and pnpm 11.

```powershell
pnpm install
Copy-Item frontend/.env.example frontend/.env.local
pnpm dev
```

Open <http://localhost:3000>. `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` is the public API base URL. It is not a secret. Never put an ingestion API key or Discord webhook URL in a `NEXT_PUBLIC_*` variable.

Useful commands from the repository root:

```powershell
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
```

## Repository layout

```text
sentinelas/
├── backend/                 # AWS backend notes and package placeholder
├── docs/                    # concise architecture and operation guides
├── firmware/
│   ├── esp32-sensor/         # HC-SR04 measurement and AWS POST sketch
│   └── esp32-maquete/        # AWS status polling and route LEDs
├── frontend/                # Next.js dashboard
├── package.json
└── pnpm-workspace.yaml
```

Firmware is Arduino IDE code and is not part of the pnpm workspace.

## Documentation

- [System architecture](docs/architecture.md)
- [AWS backend, endpoints, and verification](docs/aws-backend.md)
- [Add a monitored device](docs/device-onboarding.md)
- [Documentation index](docs/README.md)

## Credentials and TLS

Copy each firmware `config.example.h` to the ignored local file `config.local.h` and enter Wi-Fi credentials there. The sensor's AWS API key also belongs in its local config. Do not commit real credentials. Both current sketches use `WiFiClientSecure::setInsecure()` for the bench prototype: HTTPS encrypts traffic, but the ESP32 does not verify the server certificate. Replace this with certificate validation before any deployment beyond controlled tests.
