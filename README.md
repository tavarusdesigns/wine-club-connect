# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment and configuration

This project expects these environment vars at build runtime:

- VITE_SUPABASE_URL = https://owzcuyefzddkmcrpzjlk.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY = your Supabase anon key
- VITE_EVENTBRITE_ORG_ID = 141817181534

Hosting options (Vercel/Netlify/Cloudflare Pages):
- Framework preset: Vite
- Build: npm run build
- Output directory: dist
- Add the env vars above in your host’s project settings and redeploy

Supabase requirements:
- Edge Functions: eventbrite (already deployed) and normalize_phone (optional)
- Secrets: EVENTBRITE_API_KEY must be set so the eventbrite function can call Eventbrite
- Database migration: run supabase/migrations/20260105_add_referred_by_to_profiles.sql
 - CLI: supabase link --project-ref owzcuyefzddkmcrpzjlk && supabase db push
 - Or paste the SQL into the Dashboard SQL editor and run it

Events page behavior:
- By default fetches events for VITE_EVENTBRITE_ORG_ID
- Shows upcoming events by default; toggle to show past

Member sign-up fields:
- Required: First Name, Last Name, Email, Password, Mobile Phone #
- Optional: Referred By
- Phone input is pretty-formatted and normalized to +E.164 on submit
- Data flows into Supabase auth user_metadata and syncs to public.profiles (phone, referred_by)
