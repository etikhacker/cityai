# 🏙️ CityAI

> AI-powered citizen complaint platform — residents report city issues (potholes, broken lights, garbage, etc.) with a photo, and AI classifies and routes the complaint automatically.

🔗 **Live demo:** [cityai-asan.vercel.app](https://cityai-asan.vercel.app)

<!-- 📸 Add screenshots/GIF: complaint submission flow, GPS pin, admin dashboard -->
<!-- ![screenshot](./docs/screenshot-1.png) -->

---

## 🧩 Problem

Built for the **ASAN AI Hub Challenge 2026** — cities need a low-friction way for citizens to report infrastructure problems, and staff need those reports triaged automatically instead of manually reading every submission.

## ✨ Features

- 📷 **Photo-based complaint submission** — citizens snap a photo of an issue instead of filling long forms
- 🤖 **AI vision analysis** — an AI vision model classifies the complaint type and severity directly from the photo
- 📍 **GPS detection** — automatically captures and attaches the citizen's location to each report
- 🗂️ **Admin panel** — city staff view, filter, and manage incoming complaints by category/status
- 🔍 **Citizen tracking** — residents can follow the status of their own submitted reports

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Citizen App  │ ──▶ │  Vision AI model   │ ──▶ │  Classified &      │
│  (photo + GPS)│     │  (complaint         │     │  categorized        │
│                │     │  classification)    │     │  complaint record   │
└──────────────┘     └──────────────────┘     └───────────────────┘
                                                        │
                                                        ▼
                                              ┌───────────────────┐
                                              │  Admin Dashboard    │
                                              │  (review & resolve)  │
                                              └───────────────────┘
```

- **Vision AI:** originally built on Claude Vision API, later migrated to free vision models via OpenRouter to keep operating costs low
- **Frontend:** deployed on Vercel
- **Data flow:** photo + GPS coordinates → AI classification → stored complaint record → admin review

## 🛠️ Tech Stack

![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel)
![Claude](https://img.shields.io/badge/-Claude_Vision-D97757?style=flat-square&logo=claude&logoColor=white)
![OpenRouter](https://img.shields.io/badge/-OpenRouter-000000?style=flat-square)

## 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/etikhacker/cityai.git
cd cityai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Fill in `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key   # if GPS/map rendering needs one
```

```bash
# 4. Run the dev server
npm run dev
```

App runs at `http://localhost:3000`.

## 📌 Status

Built for the ASAN AI Hub Challenge 2026 (April 2026 deadline) and submitted to the **ABB Innovation** incubation program.

## 📄 License

MIT
