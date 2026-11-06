# Add a monitored device

This procedure registers a new drain or waste bin so its ID stays consistent across DynamoDB, the sensor firmware, the dashboard, and (when used) the scale model.

## 1. Choose a stable device ID

Use a unique lowercase ID with underscores, such as `lixeira_02` or `bueiro_03`. Do not reuse an ID for two physical sensors: it is the DynamoDB partition key and is how the sensor reading is matched to the device record.

Choose the type exactly as `lixeira` or `bueiro`. Record the location's latitude and longitude as decimal numbers. The dashboard API uses the property names `lat` and `long` (not `lng` or `longitude`).

## 2. Create the current-state item in DynamoDB

In AWS Console, select `sa-east-1`, open **DynamoDB → Tables → Dispositivos → Explore table items → Create item**. If the editor is in **DynamoDB JSON** mode, use the typed format below; every value is wrapped in its DynamoDB type. Do not paste plain JSON into the typed editor.

```json
{
  "id_dispositivo": { "S": "lixeira_02" },
  "tipo": { "S": "lixeira" },
  "nome": { "S": "Lixeira 02 - Tech Day" },
  "lat": { "N": "-23.0900" },
  "long": { "N": "-47.2200" },
  "status_atual": { "S": "sem_leitura" },
  "ultima_leitura": { "N": "0" }
}
```

Replace the sample name and coordinates with the real demo location. If the Console editor is in ordinary JSON mode instead, use native JSON values such as `"id_dispositivo": "lixeira_02"` and `"lat": -23.09`; do not combine the two formats. `id_dispositivo` must match the table's String partition key. Coordinates must be numbers, not quoted in ordinary JSON.

The sensor does not send `nome`, `lat`, or `long`; those are static metadata maintained on this item. After the first sensor POST, check that these fields remain in `Dispositivos`. The live Lambda source is not in this repository, so the function's update behavior must be confirmed in AWS. If it replaces the whole item, update it to preserve the static metadata before using this onboarding flow for more devices.

## 3. Configure and flash the sensor

Open `firmware/esp32-sensor/esp32-sensor.ino` and set the per-device constants:

```cpp
const char* ID_DISPOSITIVO = "lixeira_02";
const char* TIPO_DISPOSITIVO = "lixeira";
```

Copy `firmware/esp32-sensor/config.example.h` to `config.local.h` in the same folder. Enter the Wi-Fi SSID/password and the real API key locally. The file is ignored by Git; never commit it. The endpoint is already in the sketch. Calibrate `DISTANCIA_VAZIO_CM` and `DISTANCIA_CHEIO_CM` for the new container before interpreting the occupancy percentage.

For another ESP32, compile and upload the sketch separately. Give each unit its own `ID_DISPOSITIVO` and matching DynamoDB item. The prototype's `bateria: 100` is fixed demonstration data, not a battery measurement.

## 4. Point the scale model at the desired device

The maquette firmware only watches one target at a time. In `firmware/esp32-maquete/esp32-maquete.ino`, set:

```cpp
const char *ID_DESTINO = "lixeira_02";
```

Copy that folder's `config.example.h` to its ignored `config.local.h` and enter the maquette's Wi-Fi credentials. The maquette calls the public `GET /dispositivos`; it does not need the sensor ingestion key.

## 5. Verify the complete path

1. In Arduino IDE, select the correct ESP32 board and port, upload the sensor sketch, and open Serial Monitor at 115200 baud.
2. Confirm a valid distance, estimated occupancy, and a successful HTTP response from `POST /leituras`.
3. Call `GET https://e5rd5fpsvh.execute-api.sa-east-1.amazonaws.com/dispositivos` and find the exact new ID. Verify that name and coordinates are still present and that the timestamp changes.
4. Open the dashboard. The device should appear in the list; it appears on the map only if `lat` and `long` are valid numeric coordinates.
5. If using the maquette, confirm its `ID_DESTINO` matches the same ID and test readings on both sides of the critical threshold (80%). The LEDs should animate only while the returned state is `critico`.

If the record is missing or stale, inspect the ingestion and processing Lambda logs and the SQS trigger before re-uploading or recreating the DynamoDB item. For endpoint contracts and Console verification, see [AWS backend](aws-backend.md).
