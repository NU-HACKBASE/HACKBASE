# frontend

フロントエンドの実装本体はこのディレクトリに集約しています。

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Cloudflare

Cloudflare Pages / Workers Assets 向けの設定は `wrangler.jsonc` に置いています。

- build command: `npm --prefix frontend ci && npm --prefix frontend run build`
- output directory: `frontend/dist`
- frontend の環境変数は `VITE_` prefix を使います
