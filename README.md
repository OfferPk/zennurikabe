# ZenNurikabe 🌊🏝️

> **ZenNurikabe**: A calm, meditative Japanese Nurikabe grid logic puzzle. Carve serene garden islands out of a continuous flowing ocean stream with soothing procedural water acoustics.

[![CI](https://github.com/OfferPk/zennurikabe/actions/workflows/ci.yml/badge.svg)](https://github.com/OfferPk/zennurikabe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-34d399.svg)](https://offerpk.github.io/zennurikabe/)

---

## 🎮 Play Online
Play instantly in your browser:  
👉 **[https://offerpk.github.io/zennurikabe/](https://offerpk.github.io/zennurikabe/)**

---

## ✨ Features

- **50 Handcrafted Puzzles**: 5 difficulty packs ranging from gentle introductory 5×5 gardens to intricate 9×9 sanctuaries:
  - 🌱 **Spring Garden** (5×5) — Levels 1–10
  - 🎏 **Koi Pond** (6×6) — Levels 11–20
  - 🪨 **Stone Archipelago** (7×7) — Levels 21–30
  - 🌫️ **Mist River** (8×8) — Levels 31–40
  - ⛩️ **Zen Sanctuary** (9×9) — Levels 41–50
- **Procedural Water & Garden Acoustics**: Pure Web Audio synthesizer creating realistic crystal water droplet plucks, dry bamboo ticks, stream ripple chimes, and deep zen temple victory gongs without any audio sample dependencies.
- **Deductive Hints Engine**: Instant hints detecting 2×2 pool violations, island isolation, adjacent clue separation, and forced stream extensions.
- **Intuitive Controls**: Tap to cycle (Unshaded -> Stream Wall -> Island Dot -> Unshaded), drag across cells to trace ocean streams, undo, and reset.
- **100% Offline & Private**: Zero external network dependencies, no tracking, no ads. Built as a PWA and wrapped with Capacitor for native Android.

---

## 📜 Nurikabe Rules

1. **Numbered Clues**: Each island contains exactly one numbered clue cell indicating its total area.
2. **Island Separation**: Islands cannot touch each other orthogonally (they may touch diagonally).
3. **Continuous Stream**: All ocean stream cells must form a single, contiguous connected body of water.
4. **No 2×2 Pools**: There can never be a 2×2 square of ocean stream cells anywhere on the grid.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Run engine test suite
npm test

# Build web assets to www/
npm run build
```

---

## 📱 Android App Build

Built using Capacitor:
```bash
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```
The debug APK is generated and uploaded as an Actions artifact on every release build (`zennurikabe-apk`).

---

## 📄 License
MIT License • Developed with care by [OfferPk](https://github.com/OfferPk).
