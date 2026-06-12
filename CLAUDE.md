# OBD Scanner — Claude Code Guide

## Project Overview

React Native (iOS-first) OBD-II diagnostic app connecting to car OBD adapters via Bluetooth Classic. Supports real-time engine data, DTC fault code scanning, and VIN decoding. UI is available in English (`en`), Armenian (`hy`), and Russian (`ru`).

**Platform:** iOS only (Android permission code exists but is untested).  
**Entry point:** `App.tsx` → `ProfileSetupScreen` → `DashboardScreen`

---

## Directory Structure

```
obdScanner/
├── App.tsx                          # Root router
├── codes.json                       # DTC fault code lookup table (Code → Description)
├── src/
│   ├── store/
│   │   └── obdStore.ts              # Global Zustand store (single source of truth)
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Main screen — all BT/OBD logic lives here
│   │   ├── ProfileSetupScreen.tsx   # First-launch name/photo setup
│   │   └── ProfileEditScreen.tsx    # Edit profile overlay from dashboard
│   ├── components/
│   │   ├── ConnectModal.tsx         # BT device picker + connect/disconnect UI
│   │   ├── DInput.tsx               # react-hook-form controlled TextInput
│   │   ├── LanguageSelector.tsx     # Bottom sheet language picker
│   │   ├── NotificationModal.tsx    # success / error / info overlay modal
│   │   ├── ProfileAvatar.tsx        # Initials fallback avatar + image
│   │   └── tabs/
│   │       ├── EngineTab.tsx        # RPM + Speed bar gauges, live polling toggle
│   │       ├── ErrorLogTab.tsx      # DTC fault codes list + scan button
│   │       ├── BatteryTab.tsx       # Stub — not implemented
│   │       ├── BrakePadTab.tsx      # Stub — not implemented
│   │       ├── ABSTab.tsx           # Stub — not implemented
│   │       └── ACTab.tsx            # Stub — not implemented
│   ├── services/
│   │   └── carImageService.ts       # VIN decode (NHTSA API) + car image URL (CarImages API)
│   ├── i18n/
│   │   ├── index.ts                 # i18next initialisation
│   │   └── locales/
│   │       ├── en.json
│   │       ├── hy.json
│   │       └── ru.json
│   └── validation/
│       └── profileSchema.ts         # Yup schema for first name / last name
```

---

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F2F2F7` | Screen background, header, bottom bar |
| Surface | `#FFFFFF` | Cards, chips, buttons |
| Primary | `#1a1a1a` | Headings, active tab, CTA button |
| Accent Blue | `#007AFF` | Live-polling button, bar fill, action buttons |
| Success Green | `#34C759` | Connected dot, status "On" |
| Success Surface | `#E8F5E9` | Connected badge bg, active chip bg |
| Success Text | `#2E7D32` | Connected badge text, active chip text |
| Error Red | `#FF3B30` | Status "Off" |
| Border | `#E5E5EA` | Header bottom border |
| Muted Text | `#888` / `#999` | Subtitles, units, labels |
| Disabled | `#ccc` | Disabled buttons, inactive dots |

### Typography

| Role | Size | Weight |
|------|------|--------|
| Screen title / Name | 17 | 800 |
| Section heading | 16–18 | 700–800 |
| Body / Tab label | 14–15 | 600 |
| Gauge value | 28 | 800 |
| Stat value | 20 | 800 |
| Caption / VIN | 12 | 500–600 |

### Spacing & Shape

- Card `borderRadius`: **20**, stat card: **16**, action buttons: **14**, chips: **20** (pill)
- Card `padding`: **20–28 px**, content gap: **12–16 px**
- Shadow recipe (cards): `shadowColor #000`, `offset {0,2–4}`, `opacity 0.06–0.08`, `radius 6–12`, `elevation 2–3`
- Safe area: `paddingTop` = iOS **56** / Android **44** in header; `paddingBottom` = iOS **36** / Android **24** in bottom bar

---

## State Management (`src/store/obdStore.ts`)

Single Zustand store — `useObdStore`. All components read and write through it.

### State Slices

| Slice | Key fields |
|-------|-----------|
| Connection | `bleDeviceId`, `obdConnected`, `obdConnecting`, `obdLastResponse` |
| BLE config | `bleServiceUUID` (FFE0), `bleRxCharUUID` / `bleTxCharUUID` (FFE1) |
| Vehicle info | `vehicleVin`, `vehicleMake`, `vinReading` |
| Live data | `obdRpm`, `obdSpeedKmh`, `livePolling` |
| DTC | `dtcResults: {code, description}[]`, `dtcScanning` |
| UI | `activeTab` (default `'Engine'`), `showSettings`, `languageSelectorVisible` |
| Modal | `modalVisible`, `modalType`, `modalTitle`, `modalMessage` |
| Profile | `userFirstName`, `userLastName`, `userProfileImage`, `profileSetupComplete`, `profileEditVisible` |

Key action: `resetConnection()` — clears live data, RPM, speed, DTC results, sets `obdConnected: false`.

---

## Bluetooth / OBD Flow (`DashboardScreen.tsx`)

```
startBleScan()
  → RNBluetoothClassic.getBondedDevices()   # paired devices only (no discovery)
  → setBleDevices([...])                    # shown in ConnectModal

handleObdConnect()
  → RNBluetoothClassic.connectToDevice(bleDeviceId, { delimiter: '\r' })
  → bleDeviceRef.current = device           # stored in ref, NOT in store
  → obdInit()                               # AT command handshake
  → readVehicleInfo()                       # VIN decode
  → showModal('success', ...)

Live polling (1s interval via setInterval)
  → obdSend('010C') → parseRpmFrom010C()    # RPM = (A*256+B)/4
  → obdSend('010D') → parseSpeedFrom010D()  # Speed = byte value km/h

DTC scan
  → obdSend('03', 10 000ms) → parseDTCs()  # looks for 0x43 marker byte
  → dtcLookup[code] from codes.json

Disconnect
  → clearInterval + bleDeviceRef.disconnect()
  → resetConnection()
```

### AT Init Sequence

`ATZ` → `ATE0` → `ATL0` → `ATS0` → `ATH0` → `ATSP0`

### OBD Read Loop (`obdReadUntilPrompt`)

Polls `device.read()` every 50 ms; returns when `>` prompt is found **or** 500 ms of silence after first data **or** timeout.

---

## External APIs (`src/services/carImageService.ts`)

| API | Endpoint | Purpose |
|-----|----------|---------|
| NHTSA vPIC | `vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}` | Free VIN decode → make, model, year |
| CarImages API | `carimagesapi.com/api/v1/signed-url` | Car photo URL (key + secret in file) |

`fetchCarImageUrl(make, model?, year?)` — called twice: once on mount with a hardcoded fallback (`opel/vectra/2000`) and again after VIN decode. The fallback should be removed once real VIN data is available.

---

## Internationalisation

- Keys live in `src/i18n/locales/{en,hy,ru}.json`
- All user-facing strings must use `t('key')` — never hardcode English in JSX
- `activeTab` is stored as the **translated label string** (not a key), so tab comparisons use `t('dashboard.errorLog')` etc.
- Add new keys to all three locale files simultaneously

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `react-native-bluetooth-classic` | Bluetooth Classic serial I/O |
| `react-native-image-picker` | Profile photo selection |
| `zustand` | Global state management |
| `react-hook-form` + `yup` | Profile form validation |
| `react-i18next` | Internationalisation |

---

## Dev Notes & Gotchas

- `bleDeviceRef` is a **React ref** (`useRef<BluetoothDevice>`), not store state — it holds the live BT connection object and is not serialisable.
- `showSettings` defaults to `true` in the store (settings panel visible on launch). Currently the "+" header button in older design toggled it; the new design uses `ConnectModal` instead.
- `activeTab` defaults to `'Engine'` (English string). When the language changes the tab label changes but `activeTab` is not auto-updated — tab switching resets it naturally.
- The hardcoded `fetchCarImageUrl('opel', 'vectra', '2000')` in the `useEffect` on mount is a placeholder for when no VIN is connected yet.
- `parseDTCs` expects a `0x43` byte marker — responses without it return no codes (not an error).
- DTC lookup strips everything after `/` in `codes.json` entries and upper-cases before lookup.
