# SuperTrend Bot — Extensión Chrome MV3 (Bybit Spot)

Extensión de Chrome **100% standalone** para operar en Bybit Spot con señales de SuperTrend.

## Qué hace

- Calcula tendencia con **SuperTrend** en timeframe principal.
- Usa **filtro de tendencia mayor** para validar señales.
- Ejecuta **auto-trade** por señales:
  - BUY: cuando SuperTrend cambia de bajista a alcista.
  - SELL: cuando SuperTrend cambia de alcista a bajista.
- Gestión de riesgo:
  - Stop Loss %
  - Take Profit %
  - Límite de pérdida diaria
- Notificaciones y logs en tiempo real.
- Modo **TESTNET** y **REAL**.
- Modo **solo señales** (sin ejecutar órdenes) con `Auto-trade: OFF`.

## Estructura relevante

- `manifest.json`: configuración MV3.
- `background.js`: motor del bot y ejecución de órdenes.
- `popup.html` + `popup.js`: interfaz y configuración.
- `lib/bybit.js`: cliente Bybit V5 Spot (firmas HMAC + requests).
- `lib/supertrend.js`: cálculo del indicador.
- `chart.js`: render del gráfico del popup.

## Instalación

1. Descarga o clona el repo.
2. Abre `chrome://extensions/`.
3. Activa **Developer mode**.
4. Haz click en **Load unpacked**.
5. Selecciona esta carpeta del proyecto.

## Configuración inicial

1. Abre el popup de la extensión.
2. Ve a **⚙ Configuración**.
3. Completa:
   - API Key
   - Secret Key
   - Modo (`TESTNET` recomendado para pruebas)
   - Par (ej. `BTCUSDT`)
   - USDT por orden
   - Timeframes
   - SL/TP y límite diario
   - Auto-trade (`ON` para ejecutar, `OFF` para solo alertas)
4. Guarda.
5. Ve al dashboard y pulsa **Iniciar**.

## Flujo de señales

- `BUY` si `prevTrend = -1` y `currentTrend = 1`.
- `SELL` si `prevTrend = 1` y `currentTrend = -1`.
- Si hay filtro mayor contrario, la señal se ignora.
- Con Auto-trade ON:
  - BUY abre posición spot (compra con USDT).
  - SELL cierra posición spot (vende BTC).
- Con Auto-trade OFF:
  - Solo registra/avisa señal, sin ejecutar orden.

## Seguridad

- Empieza siempre en **TESTNET**.
- Usa API keys sin permisos de retiro.
- Verifica tamaño de orden y límites de riesgo antes de pasar a REAL.

## Nota

Este proyecto está orientado a **extensión Chrome MV3**. Los archivos web heredados no son necesarios para operar el bot de la extensión.
