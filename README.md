# Zenvy Client Portal

Premium role-based Client + Admin portal built with React, Vite, Tailwind CSS, Framer Motion, and Supabase.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and add your Supabase project values.

3. Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor, or apply the migrations in `supabase/migrations`.

4. Start the app:

```bash
npm run dev
```

## Supabase

This app requires real Supabase credentials. Demo mode is intentionally disabled.

Create your first admin user in Supabase Auth, then insert their profile:

```sql
insert into public.users (id, email, role)
values ('AUTH_USER_UUID', 'owner@example.com', 'admin');
```

Deploy the client creation function:

```bash
supabase functions deploy create-client
```

The portal uses hybrid storage by design: Supabase stores auth, relational data, chat, invoices, PDFs, and lightweight previews; Google Drive stores raw assets, reels, videos, PSDs, and other heavy project files through each project's Drive folder URL and ID.
