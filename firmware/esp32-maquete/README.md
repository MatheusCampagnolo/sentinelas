# Scale-model ESP32 firmware

`esp32-maquete.ino` runs on the second ESP32 in the physical scale model. It polls the public `GET /dispositivos` endpoint every five seconds, finds the configured `ID_DESTINO` (currently `lixeira_01`), and alternates the route LEDs while that record reports `critico`. A valid response with a non-critical status or a missing target turns the LEDs off.

## Configure and upload

1. Install the Espressif ESP32 board package and the **ArduinoJson 7** library by Benoit Blanchon in Arduino IDE.
2. Copy `config.example.h` to `config.local.h` in this folder and enter the scale model's Wi-Fi credentials. The local file is ignored by Git. This sketch does not use the sensor ingestion API key.
3. Confirm the target in `ID_DESTINO` matches the sensor's DynamoDB ID and the record returned by `GET /dispositivos`.
4. Connect the route LEDs to GPIO 18 and GPIO 19, each with a suitable series resistor and a shared GND. The order in `PINOS_ROTA` is the physical route order.
5. Select the ESP32 board and port, upload, then open Serial Monitor at 115200 baud.

The route is a fixed physical LED sequence. The sketch does not receive a route from the dashboard or calculate a road route. It currently uses `setInsecure()` for the classroom prototype, so the HTTPS server certificate is not verified.

If a GET or JSON parse fails, the code keeps the last successfully read state. During a prolonged outage after a critical state, the LEDs may therefore keep animating until a valid response arrives or the board is restarted. This behavior should be improved before treating the design as operational equipment.
