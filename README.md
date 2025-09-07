# CrescendAI Web
CrescendAI is an AI piano tutor. This repository hosts everything related to CrescendAI's website.

## Running Locally

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Then, run the database migrations and seed the database with emails and folders:

```bash
pnpm db:migrate # automatically seeds, if not, run pnpm db:seed
```

Finally, run the Next.js development server:

```bash
pnpm dev
```
