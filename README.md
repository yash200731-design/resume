# ResumeAI — Resume → Portfolio Generator

Upload a PDF resume, let Gemini AI structure it into JSON, save it to Supabase,
and get an instant, professional portfolio page.

## Folder structure

```text
resumeai/
├── app/
│   ├── page.tsx              # Landing page — upload + analyze
│   ├── layout.tsx            # Root layout, fonts, metadata
│   ├── globals.css           # Tailwind + design tokens
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # Upload -> extract -> Gemini -> Supabase
│   └── portfolio/
│       └── page.tsx          # Portfolio dashboard (reads latest row)
├── .env.local.example
├── .gitignore
├── supabase.sql               # SQL to create the `portfolios` table
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API key** and copy it.

## 3. Create a Supabase project

1. Go to https://supabase.com/dashboard and create a new project.
2. Once it's ready, open **Project Settings -> API**.
3. Copy the **Project URL** and the **anon public** key.

## 4. Create the `portfolios` table

Open the Supabase **SQL Editor** and run the contents of `supabase.sql`
(also pasted below):

```sql
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  name text,
  title text,
  email text,
  phone text,
  location text,
  summary text,
  linkedin text,
  github text,
  skills jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table portfolios enable row level security;

create policy "Allow public insert" on portfolios
  for insert
  to anon
  with check (true);

create policy "Allow public read" on portfolios
  for select
  to anon
  using (true);
```

> These policies let the app's anon key insert and read rows, which is what
> the demo needs since there's no auth layer. If you add authentication later,
> tighten these policies (e.g. scope inserts/reads to `auth.uid()`).

## 5. Add environment variables

Copy the example file and fill in your real values:

```bash
cp .env.local.example .env.local
```

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`.env.local` is already listed in `.gitignore`, so it won't be committed.

## 6. Run the app

```bash
npm run dev
```

## 7. Open it

Go to http://localhost:3000, upload a PDF resume, click **Analyze Resume**,
and you'll be redirected to `/portfolio` once it's saved.

## Notes

- The Gemini model used is `gemini-2.5-flash`. If Google retires/renames it
  by the time you run this, open `app/api/analyze/route.ts` and swap the
  model name in the `generateContent` URL for whatever's current in your
  Google AI Studio dashboard.
- `/portfolio` always shows the **most recently created** row in
  `portfolios` — it's a single-user demo, not a multi-tenant app.
- pdf-parse only works on text-based PDFs. Scanned/image-only resumes will
  return a clear error asking for a text-based PDF instead.
