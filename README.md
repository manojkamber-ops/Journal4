# Iran Journal of Computer Science — Journal Website

A complete, production-ready academic journal website: 9 volumes (2018–2026), 36 quarterly
issues, 260 articles with complete full-text papers, on-the-fly PDF generation with an
Open Access / Scopus header band, citation exports (BibTeX / RIS / APA), search & filters,
editorial board, announcements, contact form and newsletter — all persisted in a database.

| | |
|---|---|
| Print ISSN | 2520-8438 |
| E-ISSN | 2520-8446 |
| Publishing model | Open Access (OA), CC BY 4.0 |
| Indexing | Scopus (2018–2026) |
| Frequency | Quarterly |

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui · Prisma ORM ·
SQLite (local) / PostgreSQL (production) · pdf-lib · TypeScript.

---

## 1. Run locally (SQLite — zero external services)

```bash
# 1. install dependencies (Node.js 20.9+; Bun recommended)
bun install        # or: npm install

# 2. configure the environment
cp .env.example .env

# 3. create the SQLite database schema
bun run db:push    # or: npm run db:push   (creates db/ and db/custom.db)

# 4. generate all content: 36 issues, 260 complete papers, board, announcements
bun run seed       # or: npm run seed      (renders every PDF once to get exact page counts)

# 5. start the dev server
bun run dev        # or: npm run dev       → http://localhost:3000
```

> The seed is deterministic — re-running it always reproduces the exact same journal.

---

## 2. Deploy to Vercel (Vercel Postgres / Neon)

SQLite cannot run on Vercel: serverless functions have an ephemeral, read-only filesystem,
so a file database either fails to open (Prisma error code 14 — *"Unable to open the
database file"*) or silently resets on every deployment. That is why this repo ships a
PostgreSQL schema (`prisma/schema.postgres.prisma`) and a preconfigured Vercel build
(`vercel.json`), which switches Prisma to PostgreSQL automatically during the Vercel build.

### Step-by-step

**1. Push the repo to GitHub**

```bash
git init
git add .
git commit -m "Iran Journal of Computer Science — initial release"
git branch -M main
git remote add origin https://github.com/<you>/ijcs-journal.git
git push -u origin main
```

**2. Create the database on Vercel**

- Vercel Dashboard → your account → **Storage** → **Create Database → Postgres (Neon)**.
- After creating it, open the database → **Connect** → link it to your Vercel project.
  This adds `DATABASE_URL` to the project's environment variables automatically.
- If you set `DATABASE_URL` manually, use the **pooled** connection string
  (host contains `-pooler`) with `?sslmode=require` — serverless functions need pooling.

**3. Import the repo on Vercel**

- Vercel → **Add New… → Project** → import your GitHub repo.
- Framework preset: **Next.js** (auto-detected). No extra settings needed — the build
  command comes from `vercel.json`:
  `prisma generate --schema prisma/schema.postgres.prisma && next build`
- Click **Deploy**. The first deployment will succeed even while the database is still
  empty (pages render, APIs return empty lists).

**4. Initialize the production database (one time, from your machine)**

```bash
# point Prisma at the production database and create the tables
DATABASE_URL="<POOLED_POSTGRES_URL>" npx prisma db push --accept-data-loss --schema prisma/schema.postgres.prisma

# generate the PostgreSQL Prisma client locally, then seed
npx prisma generate --schema prisma/schema.postgres.prisma
DATABASE_URL="<POOLED_POSTGRES_URL>" npx tsx scripts/seed.ts     # or: bun scripts/seed.ts

# restore the local SQLite client for everyday development
npx prisma generate
```

The seed runs entirely from your machine and writes to the remote database over HTTPS —
it takes a few minutes because it renders every paper's PDF once to compute exact page
counts. When it finishes, redeploy (or just refresh) and the site is fully populated.

**5. Done.** Every push to `main` now redeploys automatically.

---

## 3. Project structure

```
├── prisma/
│   ├── schema.prisma              # SQLite schema (local development)
│   └── schema.postgres.prisma     # PostgreSQL schema (Vercel deployment)
├── scripts/
│   ├── seed.ts                    # deterministic journal generator (run: bun run seed)
│   ├── seed-data.ts               # author/institution/keyword pools, board, announcements
│   ├── paper-text.ts              # template-based complete-paper generator
│   └── flagship/                  # hand-written / uploaded full papers (fp0 = uploaded manuscript)
├── src/
│   ├── app/                       # Next.js App Router (single-page UI + API routes)
│   │   ├── api/                   # journal, articles, issues, board, contact, newsletter, PDF
│   │   └── layout.tsx, page.tsx   # metadata + SPA shell
│   ├── components/journal/        # header, footer, views, shared bits (OaBadge, JournalLogo)
│   └── lib/
│       ├── db.ts                  # Prisma client (deployment-safe bootstrap)
│       ├── pdf-render.ts          # pdf-lib paper renderer (OA/Scopus header band)
│       └── journal-*.ts           # shared types + client fetchers
├── public/                        # cover artwork, logo, favicon assets
├── vercel.json                    # build command: PostgreSQL Prisma client + next build
└── .env.example                   # environment template
```

---

## 4. Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `PrismaClientInitializationError: Error code 14 — Unable to open the database file` (local) | The SQLite path or its parent folder is missing/unreachable. Run `npm run db:push` (creates `db/`), or set an **absolute** path in `.env` (`DATABASE_URL=file:/full/path/to/db/custom.db`). |
| Same error **on Vercel** | You are using the SQLite schema/URL in production. On Vercel the build must use `prisma/schema.postgres.prisma` (this is what `vercel.json` does) and `DATABASE_URL` must be the Postgres pooled URL. Never point production at a `file:` URL. |
| Build works but pages show empty lists | The production database has no data yet — run **Step 4** above (db push + seed). |
| `Environment variable not found: DATABASE_URL` | The variable is not set in the current environment. Locally: create `.env` from `.env.example`. On Vercel: add it in Project → Settings → Environment Variables. |
| Connection timeouts from serverless functions | Use the **pooled** Neon/Vercel Postgres connection string (`-pooler` host) and keep the function region close to the database region. |
| Node version error | Use Node.js **20.9 or newer** (Next.js 16 requirement). |

---

## 5. Notes

- **PDF generation** happens on demand per request (`/api/articles/[id]/pdf`) with
  `pdf-lib` — no file storage is needed, which keeps it serverless-friendly.
- **Contact form and newsletter** submissions persist to the database
  (`ContactMessage`, `NewsletterSubscriber` tables).
- All content — including the cover-based logo/favicon assets — is generated or
  committed in the repo; no external CDN or object storage is required.
