# Khela Calendar

Khela Calendar is a free World Cup 2026 calendar subscription website for Bangladesh football fans and friends.

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
