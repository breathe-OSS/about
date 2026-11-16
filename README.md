# Breathe (About)

> _"Breathe, breathe in the air. Don't be afraid to care."_ - **Pink Floyd**, _The Dark Side of the Moon_

<p align="center">
  <img src="assets/images/logo.png" alt="App Icon" width="128"/>
</p>

**Breathe: About & Philosophy** is the static page that explains what Breathe is, why it exists, and the philosophy behind building a ground-truth air quality network for J&K & Ladakh.

- The apps: [Android](https://github.com/breathe-OSS/breathe), [iOS](https://github.com/breathe-OSS/breathe-ios), [Web](https://github.com/breathe-OSS/site)
- The backend: [breathe api](https://github.com/breathe-OSS/api)

## Tech Stack

- **Language:** TypeScript
- **Output:** Static HTML/CSS/JS (compiled with tsc)

## Structure

```about/
├── assets/         # Images and static assets
├── src/
│   └── main.ts     # Page logic
├── index.html      # Page markup
└── style.css       # Styles
```

## Build locally

1. **Clone the repository:**
   `git clone https://github.com/breathe-OSS/about && cd about`

2. **Install dependencies and build:**
   `npm install && npx tsc`

3. **Serve the folder statically**, e.g. `npx serve .`

## Credits

This project is fully Free & Open Source Software (FOSS). Everyone who has helped build it, in code or otherwise, is listed on [about.breatheoss.app](https://about.breatheoss.app/#people). The list lives in [breathe-OSS/.github](https://github.com/breathe-OSS/.github/blob/main/contributors.json).
