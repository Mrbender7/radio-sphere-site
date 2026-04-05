# 🌍 RadioSphere.be

> **The ultimate gateway to global radio waves.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Mrbender7/remix-of-radio-sphere)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)]()

Discover **Radio Sphere**, the ultimate app to explore radio frequencies from all over the world. From the streets of **Liège** to the neon lights of **Tokyo** or the energy of **New York**, experience radio without borders.

🔗 **Live:** [radiosphere.be](https://radiosphere.be)

---

## ✨ Features

- **🌐 Global Access** — Listen to thousands of international stations via the [Radio Browser](https://www.radio-browser.info/) API, with smart mirror failover.
- **🎨 Modern Interface** — Dark-mode-first design with smooth animations (Framer Motion), responsive layout (mobile, tablet & desktop sidebar).
- **🗣️ Multilingual** — Available in 🇫🇷 French, 🇬🇧 English, 🇪🇸 Spanish, 🇩🇪 German & 🇯🇵 Japanese.
- **🔍 Advanced Search** — Filter by name, country, genre, language & codec with multi-select dropdowns.
- **⭐ Favorites** — Save & organize your go-to stations (persisted in `localStorage`).
- **📻 Weekly Discoveries** — Curated station suggestions refreshed every week.

---

## 💎 Pro Sphere (Premium Features)

- **🚗 Android Auto** — Fully optimized dashboard interface for safe in-car listening.
- **📺 Google Cast (Chromecast)** — Stream audio to smart speakers or TV with one tap.
- **⏳ Sleep Timer** — Auto-stop playback after a set duration.
- **⏪ TimeBack Machine** — Rewind & record live radio with our unique buffering technology.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animations** | Framer Motion |
| **Routing** | React Router v6 |
| **State** | React Context + TanStack Query |
| **Native bridge** | Capacitor (Android) |
| **Radio API** | Radio Browser (multi-mirror) |
| **Cast** | Google Cast SDK (Default Media Receiver) |

---

## 🔒 Security

- **Content Security Policy (CSP)** — Restricts script/style/frame sources to prevent XSS.
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **External links** — All `target="_blank"` links include `rel="noopener noreferrer"`.
- **No secrets in code** — No private API keys or tokens stored in the codebase.

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/Mrbender7/remix-of-radio-sphere.git
cd remix-of-radio-sphere

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:8080` by default.

### Build for production

```bash
npm run build
# Output in /dist
```

### Android (Capacitor)

See [`android-auto/README-SETUP.md`](android-auto/README-SETUP.md) for the full native integration guide.

---

## 📁 Project Structure

```
src/
├── components/     # UI components (Player, Sidebar, Cards…)
├── contexts/       # React contexts (Player, Favorites, Language…)
├── hooks/          # Custom hooks (useCast, useFavorites…)
├── i18n/           # Translation strings
├── pages/          # Route pages (Home, Search, Library, About…)
├── services/       # RadioService (API + mirror logic)
├── types/          # TypeScript interfaces
└── assets/         # Images & genre artwork
```

---

## 📄 License

This project is licensed under the **MIT License**.
