# busserzXcodehoppers

A modern multi-page restaurant website built with Next.js (App Router), inspired by expressive Nordic-style presentation, customized for your brand.

## Pages

- Home (`/`)
- Menu (`/menu`)
- Products (`/products`)
- About (`/about`)
- Contact (`/contact`)

## Products Data (Replace Later)

The products page uses an async helper in `src/lib/products.ts`.

- Menu source: Busserz API `/v2/menus`
- Product source: Busserz API `/v2/products`

## Busserz API Configuration

Data fetchers are implemented in `src/lib/busserz.ts` and support environment overrides:

- `BUSSERZ_API_BASE` (default: `https://data.busserz.com/v2`)
- `BUSSERZ_API_KEY`
- `BUSSERZ_SPACE_ID`

Set these in your deployment environment (recommended) to avoid keeping API credentials in source code.

## Local Development

Requirements:

- Node.js 18+
- npm

Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

This project is configured for static export (`out/`) to support GitHub Pages.

## Deploy on GitHub Pages

1. Push this project to a GitHub repository.
2. Ensure your default deployment branch is `main`.
3. In GitHub repo settings, enable Pages with "GitHub Actions" as source.
4. Push to `main`; workflow at `.github/workflows/deploy.yml` deploys automatically.

## Optional Vercel Deployment

`vercel.json` is included for optional Vercel deployment.

## License

MIT
