# Milka Service Board

## Run locally

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key_here
```

Then run:

```bash
npm install
npm run dev
```

## Deploy to Vercel

Add the same two variables in Vercel Project Settings -> Environment Variables.

Do not upload `.env` to GitHub.
