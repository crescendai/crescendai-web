# CrescendAI

A piano learning web app that provides intelligent feedback on recordings based on 19 feedback dimensions. Built with the percepiano dataset, a novel dataset for evaluating piano performance based on expert-guided annotations.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone <your-repo-url>
cd crescendai-web
pnpm install
```

## Running Locally

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Then, run the database migrations and seed the database:

```bash
pnpm db:migrate # automatically seeds, if not, run pnpm db:seed
```

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Features (Coming Soon)

- Piano recording upload and analysis
- AI-powered feedback based on 19 dimensions
- Performance scoring and recommendations
- Progress tracking
- Dark mode
- User authentication
