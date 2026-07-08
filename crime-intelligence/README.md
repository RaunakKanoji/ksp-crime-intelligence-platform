This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Catalyst AppSail Deployment

Local frontend development uses the normal Next.js server:

```bash
npm run dev
```

Open `http://localhost:3000/login` or `http://localhost:3000/signup`.
The Next.js dev server proxies Catalyst's reserved `/__catalyst/*`,
`/accounts/*`, and `/baas/*` paths to the configured Catalyst origin, so normal
local frontend development does not require `catalyst serve`.

Production deployment is AppSail, not Catalyst Client or Slate:

```bash
npm run build
cd ..
catalyst deploy --only appsail
```

AppSail uses `app-config.json`, Node.js 22, and `npm run start`. The Next.js
start script binds to `X_ZOHO_CATALYST_LISTEN_PORT`, then `PORT`, then `3000`.

## Catalyst Authentication

For embedded Catalyst auth to work in deployment and local redirects, add these
domains in Catalyst Console under Authentication authorized/CORS domains:

```txt
http://localhost:3000
https://appsail-50043682168.development.catalystappsail.in
```

Set `NEXT_PUBLIC_CATALYST_DOMAIN` in `.env.local` for localhost development so
the reserved Catalyst auth paths can be proxied to the Catalyst-hosted origin.

## Gemini NLP

Natural-language AI query interpretation can use Gemini server-side through
`POST /api/ai/query`. Add these server-only variables to `.env.local` or
AppSail environment variables:

```txt
GEMINI_API_KEY=your-api-key
GEMINI_NLP_MODEL=gemini-3.5-flash
```

If `GEMINI_API_KEY` is missing or Gemini is unavailable, the app falls back to
the local deterministic interpreter. The browser never receives the Gemini key.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Project Structure Cleanup

This repository has been optimized for production deployment:
- Legacy pages router directories were removed.
- Unused components and scripts were deleted.
- Deployment configuration in `app-config.json` was updated to run the Next.js server on the dynamic AppSail port (`npx next start -p $PORT`).
- Standard script validations like `npm run type-check` (running `tsc --noEmit`) were added.
