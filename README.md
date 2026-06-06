<div align="center">
  <img src="images/carp-logo.png" alt="Carp Life Games" width="100" />

  # Carp Fishing Competitions — Prize Draw

  **An underwater peg-reveal draw tool for live fishing events**

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Play%20Now-2ea44f?style=for-the-badge)](https://mystery-game.netlify.app)
  [![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f7df1e?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![CSS Animations](https://img.shields.io/badge/CSS-Animations-1572b6?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS/animation)
  [![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00c7b7?style=flat-square&logo=netlify)](https://netlify.com)
</div>

---

## Overview

**Carp Fishing Competitions — Prize Draw** is an underwater-themed peg draw tool for carp fishing events. The host projects this on a screen: competitors pick peg numbers, and when a peg is clicked it animates open like an oyster shell to reveal the prize inside.

Prizes are uploaded via CSV and automatically distributed across all pegs before the draw begins. Every reveal builds suspense — the oyster slowly opens to expose what's hiding inside.

---

## Features

### Live Prize Draw
- Upload prizes via **CSV file** (`prize_name`, `prize_value` columns)
- Prizes are **randomly shuffled** across all available pegs at draw start
- Each peg animates open with a configurable **suspense duration** (1–5 seconds)
- Opened pegs stay revealed for the rest of the session
- **Reload protection** — a custom confirmation dialog prevents accidental page refresh mid-draw

### Competition Management
- Set the **competition name** and **date** shown in the header
- Choose how many **pegs per section** (9 / 20 / 25 / 30)
- Support for large draws: pegs paginate across multiple sections
- Live **prize tracker** shows total, claimed, and remaining prizes

### Underwater Visual Theme
- Deep underwater background with animated ocean life
- Oyster shells as peg reveal mechanism — closed state with shimmer, open state with prize
- Gradient colour system using CSS custom properties
- Fully responsive — works on tablets and large displays

### Audio
- Built-in sound effects for peg reveals using the Web Audio API
- Toggle sound on/off in setup

### Setup & Reset
- First-load setup modal guides the host through configuration
- Full draw reset with confirmation dialog to protect in-progress sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game logic | Vanilla JavaScript (ES6 class) |
| Animations | CSS keyframes + JS-driven class toggles |
| Prize import | Native CSV file reader |
| Audio | Web Audio API |
| Fonts | Bebas Neue · Oswald (Google Fonts) |
| Deployment | Netlify |

Zero dependencies — no framework, no build step.

---

## Getting Started

### Run locally

```bash
# Clone the repo
git clone https://github.com/Khaled192/Mystery-Game.git
cd Mystery-Game

# Open in browser — no build step needed
open game.html
```

> For best results serve from a local HTTP server:
> ```bash
> npx serve .
> # or
> python3 -m http.server 8080
> ```

### CSV Format

Upload a CSV with these columns to populate prizes:

```csv
prize_name,prize_value
Rod & Reel Combo,£250
Bait Package,£75
Tackle Box,£40
```

The game shuffles prizes randomly across pegs — you can also use equal-value prizes for a pure peg-number draw.

### Deploy to Netlify

The repo includes a `netlify.toml` that redirects `/` → `/game.html`.

1. Push to GitHub
2. Connect the repo in the [Netlify dashboard](https://app.netlify.com)
3. Publish directory: `.` (root)
4. No build command needed

---

## Project Structure

```
mystery-game/
├── game.html                     # Entry point and modal HTML
├── underwater-game.js            # Game engine (draw logic, animations, CSV parsing)
├── styles/
│   └── underwater-style.css      # Full underwater theme stylesheet
├── images/
│   ├── carp-logo.png
│   ├── closedOyster.png          # Peg closed state
│   └── openedOyster.png          # Peg open state
└── netlify.toml
```

---

## Part of the Carplife Games Suite

| Game | Description |
|---|---|
| [Last Man Standing](https://github.com/Khaled192/last-man-standing) | Live tournament fish draw |
| **Mystery Game — Prize Draw** | Underwater peg reveal draw |
| Open The Doors *(coming soon)* | Fishing cabin door prize reveal |

---

<div align="center">
  Made with ❤️ for the carp fishing community by <strong>Carp Life Games</strong>
</div>
