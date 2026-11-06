#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <cstring>
#include "config.local.h"

// =================================================
// 1. CONFIGURACOES
// =================================================
// Wi-Fi credentials are loaded from config.local.h.
const char *URL_DISPOSITIVOS = "https://e5rd5fpsvh.execute-api.sa-east-1.amazonaws.com/dispositivos";
const char *ID_DESTINO = "lixeira_01";

// =================================================
// 2. CONFIGURACAO DOS LEDS
// =================================================
// Ordem fisica dos LEDs na rota.
const uint8_t PINOS_ROTA[] = {18, 19};
constexpr size_t QUANTIDADE_LEDS =
    sizeof(PINOS_ROTA) / sizeof(PINOS_ROTA[0]);

// =================================================
// 3. INTERVALOS
// =================================================
constexpr uint32_t INTERVALO_CONSULTA_MS = 5000;
constexpr uint32_t INTERVALO_RECONEXAO_MS = 10000;
constexpr uint32_t TIMEOUT_HTTP_MS = 4000;
constexpr uint32_t INTERVALO_LED_MS = 500;

// =================================================
// 4. ESTADO DO DISPOSITIVO
// =================================================
struct EstadoDispositivo {
  bool respostaValida = false;
  bool dispositivoEncontrado = false;
  bool statusCritico = false;
};
EstadoDispositivo estadoAWS;
portMUX_TYPE muxEstadoAWS =
    portMUX_INITIALIZER_UNLOCKED;

// =================================================
// 5. CONTROLE DA ANIMACAO
// =================================================
size_t indiceLedAtual = 0;
bool animacaoAtiva = false;
uint32_t instanteUltimoPasso = 0;

// =================================================
// 6. WIFI
// Wi-Fi retries run in the separate network task.
// =================================================
void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  Serial.println("\nConectando ao Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tentativas = 0;
  while (
      WiFi.status() != WL_CONNECTED &&
      tentativas < 20
  ) {
    delay(500);
    Serial.print(".");
    tentativas++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("RSSI: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nFalha ao conectar no Wi-Fi.");
    Serial.print("Status Wi-Fi: ");
    Serial.println(WiFi.status());
  }
}

// =================================================
// 7. CONSULTA AWS
// =================================================
bool consultarStatusNaAws(
    EstadoDispositivo &novoEstado
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi desconectado.");
    return false;
  }
  WiFiClientSecure clienteSeguro;
  // Modo temporario de testes.
  clienteSeguro.setInsecure();
  HTTPClient http;
  http.setConnectTimeout(TIMEOUT_HTTP_MS);
  http.setTimeout(TIMEOUT_HTTP_MS);
  if (!http.begin(clienteSeguro, URL_DISPOSITIVOS)) {
    Serial.println("Falha ao iniciar HTTPS.");
    return false;
  }
  // -----------------------------------------------
  // REQUISICAO GET
  // -----------------------------------------------
  Serial.println("\nConsultando AWS...");
  int codigoHttp = http.GET();
  if (codigoHttp != HTTP_CODE_OK) {
    Serial.printf("Erro HTTP: %d\n", codigoHttp);
    if (codigoHttp < 0) {
      Serial.println(
          http.errorToString(codigoHttp)
      );
    }
    http.end();
    return false;
  }
  // -----------------------------------------------
  // RECEBIMENTO JSON
  // -----------------------------------------------
  String corpo = http.getString();
  http.end();
  JsonDocument documento;
  DeserializationError erroJson =
      deserializeJson(documento, corpo);
  if (
      erroJson ||
      !documento.is<JsonArray>()
  ) {
    Serial.println("JSON invalido!");
    if (erroJson) {
      Serial.println(erroJson.c_str());
    }
    return false;
  }
  // -----------------------------------------------
  // PROCESSAMENTO DOS DISPOSITIVOS
  // -----------------------------------------------
  EstadoDispositivo resultado;
  resultado.respostaValida = true;
  JsonArray dispositivos =
      documento.as<JsonArray>();
  for (JsonObject dispositivo : dispositivos) {
    const char *id =
        dispositivo["id_dispositivo"] | "";
    if (strcmp(id, ID_DESTINO) != 0) {
      continue;
    }
    resultado.dispositivoEncontrado = true;
    const char *status =
        dispositivo["status_atual"] | "";
    resultado.statusCritico =
        strcmp(status, "critico") == 0;
    Serial.println("\n========== AWS ==========");
    Serial.print("ID: ");
    Serial.println(id);
    Serial.print("Status: ");
    Serial.println(status);
    Serial.println("=========================");
    break;
  }
  if (!resultado.dispositivoEncontrado) {
    Serial.printf(
        "Dispositivo %s nao encontrado.\n",
        ID_DESTINO
    );
  }
  novoEstado = resultado;
  return true;
}

// =================================================
// 8. TAREFA DE CONSULTA AWS
// =================================================
void tarefaConsultaAws(void *parametro) {
  (void)parametro;
  uint32_t ultimaTentativaWiFiMs = millis();
  TickType_t proximaExecucao =
      xTaskGetTickCount();
  while (true) {
    // ---------------------------------------------
    // WIFI
    // ---------------------------------------------
    if (WiFi.status() != WL_CONNECTED) {
      if (
          millis() - ultimaTentativaWiFiMs >=
          INTERVALO_RECONEXAO_MS
      ) {
        ultimaTentativaWiFiMs = millis();
        Serial.println(
            "\nWi-Fi desconectado. Tentando reconectar..."
        );
        conectarWiFi();
      }
    } else {
      // -------------------------------------------
      // CONSULTA AWS
      // -------------------------------------------
      EstadoDispositivo novoEstado;
      if (consultarStatusNaAws(novoEstado)) {
        portENTER_CRITICAL(&muxEstadoAWS);
        estadoAWS = novoEstado;
        portEXIT_CRITICAL(&muxEstadoAWS);
      }
    }
    vTaskDelayUntil(
        &proximaExecucao,
        pdMS_TO_TICKS(INTERVALO_CONSULTA_MS)
    );
  }
}

// =================================================
// 9. VERIFICACAO DO STATUS CRITICO
// =================================================
bool statusCriticoAtual() {
  EstadoDispositivo estado;
  portENTER_CRITICAL(&muxEstadoAWS);
  estado = estadoAWS;
  portEXIT_CRITICAL(&muxEstadoAWS);
  if (
      !estado.respostaValida ||
      !estado.dispositivoEncontrado
  ) {
    return false;
  }
  return estado.statusCritico;
}

// =================================================
// 10. APAGAR TODOS OS LEDS
// =================================================
void apagarTodosOsLeds() {
  for (
      size_t i = 0;
      i < QUANTIDADE_LEDS;
      i++
  ) {
    digitalWrite(PINOS_ROTA[i], LOW);
  }
}

// =================================================
// 11. ANIMACAO DE CASCATA ALTERNADA
// =================================================
void atualizarAnimacao(bool deveAnimar) {
  uint32_t agora = millis();
  if (QUANTIDADE_LEDS == 0) {
    return;
  }
  // Sem status critico: apaga tudo.
  if (!deveAnimar) {
    if (animacaoAtiva) {
      apagarTodosOsLeds();
      Serial.println("Rota desligada.");
    }
    animacaoAtiva = false;
    indiceLedAtual = 0;
    return;
  }
  // Inicio da animacao.
  if (!animacaoAtiva) {
    apagarTodosOsLeds();
    animacaoAtiva = true;
    indiceLedAtual = 0;
    instanteUltimoPasso = agora - INTERVALO_LED_MS;
    Serial.println("Iniciando cascata alternada.");
  }
  // Controle de velocidade.
  if (agora - instanteUltimoPasso < INTERVALO_LED_MS) {
    return;
  }
  instanteUltimoPasso = agora;
  // Avanca uma etapa.
  indiceLedAtual++;
  // Reinicia automaticamente depois do ultimo LED.
  if (indiceLedAtual > QUANTIDADE_LEDS) {
    indiceLedAtual = 1;
  }
  // Atualiza TODOS os LEDs.
  for (size_t i = 0; i < QUANTIDADE_LEDS; i++) {
    bool acender = false;
    if (i < indiceLedAtual) {
      acender = (i % 2) == ((indiceLedAtual - 1) % 2);
    }
    digitalWrite(
      PINOS_ROTA[i],
      acender ? HIGH : LOW
    );
  }
  // Diagnostico.
  Serial.printf("Etapa %u: ", (unsigned int)indiceLedAtual);
  for (size_t i = 0; i < QUANTIDADE_LEDS; i++) {
    Serial.printf(
      "LED %u=%s ",
      (unsigned int)(i + 1),
      digitalRead(PINOS_ROTA[i]) ? "ON" : "OFF"
    );
  }
  Serial.println();
}

// =================================================
// 12. SETUP
// =================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n================================");
  Serial.println("ESP32 - MONITORAMENTO DE ROTA");
  Serial.println("CONSULTA AWS + CASCATA ALTERNADA");
  Serial.println("================================");
  // -----------------------------------------------
  // CONFIGURACAO DOS LEDS
  // -----------------------------------------------
  for (
      size_t i = 0;
      i < QUANTIDADE_LEDS;
      i++
  ) {
    pinMode(PINOS_ROTA[i], OUTPUT);
    digitalWrite(PINOS_ROTA[i], LOW);
  }
  Serial.print("Quantidade de LEDs: ");
  Serial.println(QUANTIDADE_LEDS);
  // -----------------------------------------------
  // WIFI
  // -----------------------------------------------
  WiFi.mode(WIFI_STA);
  conectarWiFi();
  // -----------------------------------------------
  // TAREFA AWS
  // -----------------------------------------------
  const BaseType_t criada =
      xTaskCreatePinnedToCore(
          tarefaConsultaAws,
          "consultaAWS",
          12288,
          nullptr,
          1,
          nullptr,
          0
      );
  if (criada != pdPASS) {
    Serial.println(
        "ERRO: nao foi possivel criar tarefa AWS."
    );
  } else {
    Serial.println(
        "Tarefa AWS iniciada com sucesso."
    );
  }
}

// =================================================
// 13. LOOP PRINCIPAL
// =================================================
void loop() {
  bool critico = statusCriticoAtual();
  atualizarAnimacao(critico);
  delay(1);
}
