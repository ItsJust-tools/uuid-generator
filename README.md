# UUID Generator

Generate UUID v4 identifiers instantly, securely and client-side. Batch-generate up to 100 UUIDs at a time with formatting options.

**Live:** [uuid-generator.itsjust.tools](https://uuid-generator.itsjust.tools)

## Features

- UUID v4 generated with the platform CSPRNG (`crypto.randomUUID`)
- Batch generation from 1 to 100 UUIDs at once
- Lowercase or uppercase output
- Toggle hyphens and braces `{...}` wrapping
- One-click copy for a single UUID or the whole batch
- Save results to a short history (newest first)
- Shareable state via URL, `.itsjust.json` import/export and image/PDF export
- 100% client-side — no data ever leaves your browser

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-uuid-generator .
docker run -p 3000:3000 itsjust-uuid-generator
```

## License

MIT
