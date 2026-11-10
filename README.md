# Khela Calendar

**Every FIFA World Cup 2026 match in your own calendar, in Bangla or English.**

World Cup 2026 is played in North America, so most matches fall late at night or early morning in Bangladesh. Khela Calendar shows all 104 matches in Bangladesh time and turns them into a calendar feed you subscribe to once. Pick only your teams if you like, and Google Calendar, Apple Calendar or Outlook keeps it up to date.

![Khela Calendar home page](docs/screenshot.png)

**How it works:** a static site (`public/`) lets you choose language and teams, and a small serverless function (`api/calendar.js`) builds the matching `.ics` feed on request. No database and no paid backend, so it runs free on Vercel.

## What is included

- Bangladesh-time match browsing
- Bangla and English team-name toggle
- Country flag emoji on teams and matches
- All-matches calendar feed
- Selected-teams calendar feed
- Optional knockout-stage inclusion
- Apple Calendar, Google Calendar, Android copy URL, and `.ics` download actions
- Free Vercel-ready deployment with no paid backend

## Free deployment

1. Create a free GitHub repository.
2. Upload this project.
3. Import the repository into Vercel.
4. Deploy with the default settings.
5. Replace `https://khela-calendar.vercel.app` in `public/app.js` after you know your final Vercel URL.

## Data notes

The fixture data is stored in `public/data/matches.json`. Before public launch, verify the match list against official schedule announcements.

## Creator link

Creator links are set in `public/index.html`; the calendar event note links to Facebook from `api/calendar.js`.
