# FreqRadio 📡

**FreqRadio** is an educational, browser-based RF and antenna calculator designed for students, hobbyists, and engineers who need quick, first-order estimates for antenna design, transmission line analysis, and link budget planning.

---

## Features

| Calculator | Description |
|---|---|
| **📏 Antenna** | Wavelength, half-wave dipole, Yagi-Uda array, loop antenna, and patch antenna sizing |
| **🔌 RF Circuits** | LC resonant frequency, inductive/capacitive reactance, RLC series/parallel analysis |
| **📶 Transmission** | VSWR, reflection coefficient, return loss, mismatch loss, transmission line parameters, L-network impedance matching |
| **🌐 Propagation** | Free Space Path Loss (FSPL), link budget, Fresnel zone radii, field strength and power density |
| **🔄 Conversions** | Frequency ↔ wavelength, power units (W, mW, kW, dBm, dBW), field strength conversions |
| **🛰️ Radar & Satellite** | Radar range equation, pulse parameters, EW/jamming, satellite orbital parameters, Starlink link budget, constellation coverage |
| **📡 IoT** | LoRa/LoRaWAN, NB-IoT, LTE-M, Sigfox, BLE, Zigbee, Z-Wave link budgets; battery life estimator; BLE PHY calculator; technology comparison |

Additional features:
- 🌙 Light / Dark theme toggle (persisted across sessions)
- ⌨️ Keyboard shortcuts (`Ctrl+T` theme, `Ctrl+1–7` tabs, `F1` help, `Enter` calculate)
- 💾 Settings and presets saved to `localStorage`
- 🔗 Shareable configuration URLs
- 📱 Progressive Web App (PWA) — installable on mobile and desktop
- 📊 Interactive frequency-response charts via [Chart.js](https://www.chartjs.org/)

---

## Usage

No build step is required — the app is plain HTML + CSS + JavaScript.

### Running locally

```bash
# Option 1 — Python (built-in, no install needed)
python -m http.server 8000
# then open http://localhost:8000

# Option 2 — Node.js http-server
npx http-server
# then open http://localhost:8080
```

Or simply open `index.html` directly in any modern browser.

---

## Project Structure

```
FreqRadio/
├── index.html                          # Single-page application entry point
├── manifest.json                       # PWA manifest
└── src/
    ├── css/
    │   ├── main.css                    # Layout, typography, buttons, modals
    │   ├── calculators.css             # Calculator cards, inputs, result grids
    │   └── themes.css                  # Light / dark theme variables
    └── js/
        ├── constants.js               # Physical constants, unit maps, band definitions
        ├── utils.js                   # Core RF math helpers (VSWR, reactance, path loss…)
        ├── antenna-calculators.js     # Wavelength, dipole, Yagi, loop, patch
        ├── rf-calculators.js          # LC resonance, reactance, RLC analysis
        ├── transmission-calculators.js# VSWR, transmission line, L-network matching
        ├── propagation-calculators.js # FSPL, link budget, Fresnel zones
        ├── conversions.js             # Unit conversion tools
        ├── radar-satellite-calculators.js # Radar, EW, satellite orbital/link/constellation
        ├── iot-calculators.js         # LoRa, NB-IoT, BLE, Zigbee, battery life estimator
        ├── plotting.js                # Chart.js integration
        ├── ui.js                      # Theme, tabs, modals, settings, presets
        └── main.js                    # App initialisation, PWA, URL sharing
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+T` | Toggle light / dark theme |
| `Ctrl+1` – `Ctrl+7` | Switch between tabs |
| `F1` | Open help |
| `Enter` (in any input) | Run the calculator for that section |

---

## Disclaimer

All calculations are **first-order engineering estimates for educational purposes only**. Real-world performance depends on construction quality, materials, environment, and many other factors. Always validate designs with proper measurements and simulations before deployment.

---

## License

MIT