# Conciliaai Frontend Deploy

Recommended host: Vercel.

## Vercel

Use these settings:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable:

```txt
VITE_API_URL=https://conciliaai-api.onrender.com
```

Replace the URL above with the real backend URL from Render.

For local development with the backend running on port `3000`, create `.env.local`:

```txt
VITE_API_URL=http://localhost:3000
```
