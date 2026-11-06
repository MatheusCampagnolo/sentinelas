#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <math.h>
#include "config.local.h"
const char* ENDPOINT_AWS = "https://e5rd5fpsvh.execute-api.sa-east-1.amazonaws.com/leituras";
const char* ID_DISPOSITIVO = "lixeira_01";
const char* TIPO_DISPOSITIVO = "lixeira";
const int PIN_TRIG = 18;
const int PIN_ECHO = 19;

// =================================================
// 2. CALIBRACAO
// =================================================
const float DISTANCIA_VAZIO_CM = 30.0f;
const float DISTANCIA_CHEIO_CM = 7.0f;
const int BATERIA_PERCENTUAL = 100;

// =================================================
// 3. INTERVALOS
// =================================================
const unsigned long INTERVALO_ENVIO_MS = 2000;
const unsigned long INTERVALO_RECONEXAO_MS = 5000;
unsigned long ultimaExecucao = 0;
unsigned long ultimaTentativaWiFi = 0;

// =================================================
// 4. CONFIGURACOES DO SENSOR
// =================================================
const int NUM_LEITURAS = 12;
const unsigned long TIMEOUT_US = 25000;
const float DISTANCIA_MIN_CM = 2.0f;
const float DISTANCIA_MAX_CM = 400.0f;
const float TOLERANCIA_ECOS_CM = 5.0f;
const unsigned long INTERVALO_SENSOR_MS = 60;

// =================================================
// 5. FILTRO TEMPORAL
// =================================================
float ultimaDistanciaFiltrada = 0;
bool possuiDistanciaAnterior = false;

// =================================================
// 6. CONTROLE WIFI
// =================================================
bool wifiConectadoAnteriormente = false;

// =================================================
// 7. ORDENACAO
// =================================================
void ordenar(float valores[], int tamanho) {
  for (int i = 0; i < tamanho - 1; i++) {
    for (int j = 0; j < tamanho - 1 - i; j++) {
      if (valores[j] > valores[j + 1]) {
        float temp = valores[j];
        valores[j] = valores[j + 1];
        valores[j + 1] = temp;
      }
    }
  }
}

// =================================================
// 8. MEDIANA
// =================================================
float mediana(float valores[], int tamanho) {
  ordenar(valores, tamanho);
  if (tamanho % 2 == 1) {
    return valores[tamanho / 2];
  }
  return (
    valores[tamanho / 2 - 1] +
    valores[tamanho / 2]
  ) / 2.0f;
}

// =================================================
// 9. LEITURA HC-SR04
// =================================================
float lerDistanciaCm() {
  float leituras[NUM_LEITURAS];
  int quantidade = 0;
  int semEco = 0;
  int foraDaFaixa = 0;
  Serial.println("\n========== LEITURA SENSOR ==========");
  for (int i = 0; i < NUM_LEITURAS; i++) {
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(5);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    unsigned long duracao =
      pulseIn(PIN_ECHO, HIGH, TIMEOUT_US);
    if (duracao > 0) {
      float distancia =
        duracao * 0.0343f / 2.0f;
      if (
        distancia >= DISTANCIA_MIN_CM &&
        distancia <= DISTANCIA_MAX_CM
      ) {
        leituras[quantidade] = distancia;
        quantidade++;
        Serial.printf(
          "Tentativa %d: %.2f cm - ECO VALIDO\n",
          i + 1,
          distancia
        );
      } else {
        foraDaFaixa++;
        Serial.printf(
          "Tentativa %d: %.2f cm - FORA DA FAIXA\n",
          i + 1,
          distancia
        );
      }
    } else {
      semEco++;
      Serial.printf(
        "Tentativa %d: SEM ECO\n",
        i + 1
      );
    }
    delay(INTERVALO_SENSOR_MS);
  }
  Serial.println("------------------------------------");
  Serial.printf(
    "Ecos recebidos: %d/%d\n",
    quantidade,
    NUM_LEITURAS
  );
  Serial.printf("Sem eco: %d\n", semEco);
  Serial.printf("Fora da faixa: %d\n", foraDaFaixa);
  if (quantidade < 2) {
    Serial.println("ERRO: menos de 2 ecos validos.");
    return -1;
  }
  ordenar(leituras, quantidade);
  int melhorInicio = 0;
  int melhorQuantidade = 0;
  float melhorAmplitude = 9999.0f;
  bool gruposEmpatados = false;
  for (int i = 0; i < quantidade; i++) {
    int fim = i + 1;
    while (
      fim < quantidade &&
      (leituras[fim] - leituras[i])
        <= TOLERANCIA_ECOS_CM
    ) {
      fim++;
    }
    int contador = fim - i;
    float amplitude =
      leituras[fim - 1] - leituras[i];
    if (contador > melhorQuantidade) {
      melhorQuantidade = contador;
      melhorInicio = i;
      melhorAmplitude = amplitude;
      gruposEmpatados = false;
    } else if (
      contador == melhorQuantidade &&
      contador >= 2
    ) {
      int melhorFim =
        melhorInicio + melhorQuantidade - 1;
      bool sobreposto =
        (i <= melhorFim) &&
        ((fim - 1) >= melhorInicio);
      if (!sobreposto) {
        gruposEmpatados = true;
      } else if (amplitude < melhorAmplitude) {
        melhorInicio = i;
        melhorAmplitude = amplitude;
      }
    }
  }
  if (melhorQuantidade < 2) {
    Serial.println("ERRO: ecos inconsistentes.");
    return -1;
  }
  if (gruposEmpatados) {
    Serial.println("ERRO: grupos de ecos ambiguos.");
    return -1;
  }
  float grupo[NUM_LEITURAS];
  for (int i = 0; i < melhorQuantidade; i++) {
    grupo[i] = leituras[melhorInicio + i];
  }
  float distanciaBruta =
    mediana(grupo, melhorQuantidade);
  Serial.printf(
    "\nGrupo selecionado: %d ecos\n",
    melhorQuantidade
  );
  Serial.printf(
    "Amplitude: %.2f cm\n",
    melhorAmplitude
  );
  Serial.printf(
    "Distancia bruta: %.2f cm\n",
    distanciaBruta
  );
  if (melhorQuantidade >= 6) {
    Serial.println("CONFIANCA: ALTA");
  } else if (melhorQuantidade >= 4) {
    Serial.println("CONFIANCA: BOA");
  } else if (melhorQuantidade == 3) {
    Serial.println("CONFIANCA: MEDIA");
  } else {
    Serial.println("CONFIANCA: BAIXA");
  }
  float resultado;
  if (!possuiDistanciaAnterior) {
    resultado = distanciaBruta;
    possuiDistanciaAnterior = true;
  } else {
    float diferenca =
      fabsf(distanciaBruta - ultimaDistanciaFiltrada);
    if (diferenca >= 5.0f) {
      resultado = distanciaBruta;
      Serial.println("Mudanca significativa detectada.");
    } else {
      const float FATOR_NOVA_LEITURA = 0.70f;
      resultado =
        ultimaDistanciaFiltrada * 0.30f +
        distanciaBruta * FATOR_NOVA_LEITURA;
    }
  }
  ultimaDistanciaFiltrada = resultado;
  Serial.printf(
    "Distancia final: %.2f cm\n",
    resultado
  );
  Serial.println("====================================");
  return resultado;
}

// =================================================
// 10. CALCULO OCUPACAO
// =================================================
float calcularOcupacao(float distanciaCm) {
  const float faixa =
    DISTANCIA_VAZIO_CM - DISTANCIA_CHEIO_CM;
  if (faixa <= 0) return 0;
  float ocupacao =
    (
      (DISTANCIA_VAZIO_CM - distanciaCm)
      / faixa
    ) * 100.0f;
  return constrain(ocupacao, 0.0f, 100.0f);
}

// =================================================
// 11. CONEXAO INICIAL WIFI
// =================================================
void conectarWiFi() {
  Serial.println("\n================================");
  Serial.println("INICIANDO CONEXAO WIFI");
  Serial.println("================================");
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  Serial.print("Conectando");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long inicio = millis();
  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - inicio < 15000
  ) {
    delay(500);
    Serial.print(".");
  }
  ultimaTentativaWiFi = millis();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWIFI CONECTADO!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("MAC: ");
    Serial.println(WiFi.macAddress());
    Serial.print("Sinal Wi-Fi (RSSI): ");
    Serial.println(WiFi.RSSI());
    wifiConectadoAnteriormente = true;
  } else {
    Serial.println("\nFALHA NA CONEXAO WIFI!");
    Serial.print("Status Wi-Fi: ");
    Serial.println(WiFi.status());
    wifiConectadoAnteriormente = false;
  }
}

// =================================================
// 12. VERIFICACAO E RECONEXAO WIFI
// =================================================
void verificarWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConectadoAnteriormente) {
      Serial.println("\nWIFI RECONECTADO!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      wifiConectadoAnteriormente = true;
    }
    return;
  }
  if (wifiConectadoAnteriormente) {
    Serial.println("\nWIFI DESCONECTADO!");
    wifiConectadoAnteriormente = false;
  }
  if (
    millis() - ultimaTentativaWiFi >=
    INTERVALO_RECONEXAO_MS
  ) {
    ultimaTentativaWiFi = millis();
    Serial.println("\nTentando reconectar Wi-Fi...");
    WiFi.reconnect();
  }
}

// =================================================
// 13. ENVIO AWS
// =================================================
void enviarLeitura(
  float distanciaCm,
  float ocupacao
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sem Wi-Fi. Envio cancelado.");
    return;
  }
  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure();
  HTTPClient http;
  http.setConnectTimeout(5000);
  http.setTimeout(5000);
  if (!http.begin(clienteSeguro, ENDPOINT_AWS)) {
    Serial.println("Falha ao iniciar HTTPS.");
    return;
  }
  http.addHeader(
    "Content-Type",
    "application/json"
  );
  http.addHeader(
    "x-api-key",
    API_KEY
  );
  String corpo = "{";
  corpo += "\"id_dispositivo\":\"";
  corpo += ID_DISPOSITIVO;
  corpo += "\",";
  corpo += "\"tipo\":\"";
  corpo += TIPO_DISPOSITIVO;
  corpo += "\",";
  corpo += "\"nivel_ocupacao\":";
  corpo += String(ocupacao, 1);
  corpo += ",";
  corpo += "\"distancia_cm\":";
  corpo += String(distanciaCm, 1);
  corpo += ",";
  corpo += "\"bateria\":";
  corpo += String(BATERIA_PERCENTUAL);
  corpo += "}";
  Serial.println("\nEnviando para AWS...");
  Serial.println(corpo);
  unsigned long inicioEnvio = millis();
  int codigoHTTP = http.POST(corpo);
  unsigned long tempoEnvio =
    millis() - inicioEnvio;
  if (codigoHTTP > 0) {
    Serial.printf(
      "Resposta AWS: HTTP %d\n",
      codigoHTTP
    );
    Serial.printf(
      "Tempo de envio: %lu ms\n",
      tempoEnvio
    );
    Serial.println(http.getString());
  } else {
    Serial.printf(
      "Erro AWS: %s\n",
      http.errorToString(codigoHTTP).c_str()
    );
  }
  http.end();
}

// =================================================
// 14. SETUP
// =================================================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);
  delay(300);
  Serial.println("\n================================");
  Serial.println("MONITORAMENTO DE LIXEIRA");
  Serial.println("ESP32 + HC-SR04 + AWS");
  Serial.println("================================");
  conectarWiFi();
  ultimaExecucao =
    millis() - INTERVALO_ENVIO_MS;
}

// =================================================
// 15. LOOP PRINCIPAL
// =================================================
void loop() {
  verificarWiFi();
  if (
    millis() - ultimaExecucao >=
    INTERVALO_ENVIO_MS
  ) {
    ultimaExecucao = millis();
    // LEITURA DO SENSOR
    float distanciaCm = lerDistanciaCm();
    if (
      distanciaCm < DISTANCIA_MIN_CM ||
      distanciaCm > DISTANCIA_MAX_CM
    ) {
      Serial.println(
        "\nMedicao invalida. Envio cancelado."
      );
      return;
    }
    // CALCULO OCUPACAO
    float ocupacao =
      calcularOcupacao(distanciaCm);
    Serial.println("\n========== RESULTADO ==========");
    Serial.printf(
      "Distancia: %.2f cm\n",
      distanciaCm
    );
    Serial.printf(
      "Ocupacao: %.1f%%\n",
      ocupacao
    );
    Serial.println("================================");
    // ENVIO AWS
    enviarLeitura(
      distanciaCm,
      ocupacao
    );
  }
}
