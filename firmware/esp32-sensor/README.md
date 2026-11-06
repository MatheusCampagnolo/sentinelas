# ESP32 sensor firmware

This sketch runs on the ESP32 DevKit V1 with an HC-SR04. It collects 12 distance samples, rejects invalid or inconsistent echoes, applies median and temporal filtering, estimates occupancy, and posts a reading to AWS every two seconds.

## Configure and upload

1. Install the Espressif ESP32 board package in Arduino IDE and select the matching ESP32 DevKit V1 board and port.
2. Copy `config.example.h` to `config.local.h` in this folder. Set the Wi-Fi SSID/password and replace `XXXX` with the ingestion key from `ingestaLeitura`. `config.local.h` is ignored by Git.
3. Confirm the public API endpoint in `esp32-sensor.ino` and set `ID_DISPOSITIVO` and `TIPO_DISPOSITIVO` for the registered point.
4. Wire HC-SR04 TRIG to GPIO 18 and ECHO to GPIO 19. **Use a voltage divider or logic-level shifter on ECHO**; do not connect a 5 V echo output directly to an ESP32 GPIO. Connect VCC and GND according to the sensor and board.
5. Calibrate `DISTANCIA_VAZIO_CM` and `DISTANCIA_CHEIO_CM` for the actual container.
6. Compile and upload. Open Serial Monitor at 115200 baud.

The sketch currently uses `setInsecure()` for the bench prototype. HTTPS traffic is encrypted, but the ESP32 does not validate the AWS server certificate. Do not use this configuration for a real field deployment; install the appropriate CA certificate and use `setCACert()` first.

`BATERIA_PERCENTUAL` is fixed at 100 for the demonstration and is not measured. See [device onboarding](../../docs/device-onboarding.md) for registering the ID and coordinates in DynamoDB.
