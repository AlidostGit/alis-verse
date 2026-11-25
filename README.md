# Ali's Verse

A first-person 3D portfolio for Ali Dost, built with Three.js, Rapier physics, TypeScript and Vite.
Walk a cloud-sea hilltop and press E at each landmark to open a chapter of Ali's career.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands: `npm run build` (outputs to `dist/`), `npm run preview`, `npm test`.

## Deploy to Vercel

Push this folder to a GitHub repository and import it in Vercel, or run `npx vercel` from this folder.
`vercel.json` already sets the Vite build (`npm run build`, output `dist`).

## Where things live

- `src/game/portfolio.ts` - all career, project and certification content shown in the panels
- `src/game/story.ts` - what the creatures on the hill say
- `src/game/landmarks.ts` - landmark positions, signboards and the welcome stone
- `src/ui/ui.ts`, `src/styles/main.css` - menus, HUD and the chapter panel
- `src/i18n/en.json` - interface text
- `public/models/` - the six landmark 3D models (GLB)

Debug URL options: `?play` (skip title), `?chapter=motive` (open a chapter), `?q=low|medium|high` (graphics quality).

Fonts: Sora and Figtree (SIL OFL 1.1). Hilltop scene remixed from the Faraway showcase.
