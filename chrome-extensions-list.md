# Chrome Extensions Found (Recursive Extraction Complete)

## 1. Root Extension (Main - Complete)
**Path:** `./`
**Files (10):**
- `manifest.json` - MV3 config
- `popup.html` - UI dashboard/chart/logs/settings
- `popup.js` - Popup logic
- `background.js` - Service worker (Bybit Spot bot)
- `chart.js` - Canvas SuperTrend charts
- `bybit.js` - Bybit V5 API
- `supertrend.js` - SuperTrend indicator
- `icon16.png`, `icon48.png`, `icon128.png`

**Load:** chrome://extensions/ → Load unpacked → `./`

## 2. SuperTrend-Clean/ (Clean Variant - Complete)
**Path:** `./SuperTrend-Clean/`
**Files:** background.js, manifest.json, popup.html, popup.js + dashboard variants (code.html screenshots)

## 3. SuperTrend-Minimal/ (Minimal Variant - Complete)
**Path:** `./SuperTrend-Minimal/`
**Files:** manifest.json, popup.html/js, background.js, chart.js, icons + lib/ (ai/bybit/storage/supertrend/utils)

## Other (Fragments/Zips):
- `public/` - Duplicate manifest/background
- `stitch_supertrend_bot_dashboard (3).zip` - Dashboard zip (unzip for more)
- `popup_ai.html` - AI variant popup

**All extracted/organized.** Load any folder via chrome://extensions/ → Load unpacked.

**Test Root:** Safest/full-featured Bybit Spot SuperTrend bot (testnet).
