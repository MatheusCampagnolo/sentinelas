# AWS backend

The live backend uses API Gateway, Lambda, SQS, and DynamoDB. The current endpoint contracts, recorded resource names, Console checks, and end-to-end test procedure are documented in [AWS backend](../docs/aws-backend.md); the overall system flow is in [architecture](../docs/architecture.md).

The deployed Lambda source is not yet checked into this repository. The `backend` workspace package is therefore a documentation and source-code placeholder, not a deployable serverless application. The AWS Console remains the source of truth until the live functions are exported, reviewed, and added here. Do not upload unverified examples over the Console functions.

Current responsibilities:

| Function | Trigger / route | Responsibility |
|---|---|---|
| `ingestaLeitura` | `POST /leituras` | Validate the ingestion key and payload, then enqueue the reading. |
| `processarLeitura` | SQS `fila-leituras` | Classify occupancy and update reading history and current device state. |
| `obterStatus` | `GET /dispositivos` | Return the latest device records as a JSON array. |

The API key belongs only in the sensor's ignored local config and the ingestion function's server-side configuration. The dashboard and scale ESP32 use the status GET without that key.
