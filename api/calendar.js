const matches = require("../public/data/matches.json");
const teams = require("../public/data/teams.json");

const teamByName = new Map(teams.map((team) => [team.name, team]));
const teamByCode = new Map(teams.map((team) => [team.code, team]));

function pad(value) {
  return String(value).padStart(2, "0");
}

function toUtcStamp(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00Z`;
}

function nowUtcStamp() {
  const now = new Date();
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

function addMinutes(date, time, minutesToAdd) {
  const stamp = new Date(`${date}T${time}:00Z`);
  stamp.setUTCMinutes(stamp.getUTCMinutes() + minutesToAdd);
  return `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}00Z`;
}

function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line) {
  const chunks = [];
  let rest = line;
  while (rest.length > 73) {
    chunks.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function displayTeam(name, lang) {
  const team = teamByName.get(name) || { name, flag: "", bn: name };
  if (name === "TBD") return lang === "bn" ? "নির্ধারিত হবে" : "TBD";
  if (lang === "bn") return `${team.flag} ${team.bn} / ${team.name}`;
  return `${team.flag} ${team.name}`;
}

function filteredMatches(query) {
  const scope = query.scope || "all";
  const requestedCodes = String(query.teams || "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  if (scope !== "teams" || requestedCodes.length === 0) return matches;

  const requestedNames = new Set(
    requestedCodes
      .map((code) => teamByCode.get(code))
      .filter(Boolean)
      .map((team) => team.name),
  );

  const includeKnockout = query.knockouts === "1";
  return matches.filter((match) => {
    const isSelectedTeam = requestedNames.has(match.team_a) || requestedNames.has(match.team_b);
    const isKnockout = !/^Group /.test(match.group);
    return isSelectedTeam || (includeKnockout && isKnockout);
  });
}

module.exports = function handler(req, res) {
  const lang = req.query.lang === "bn" ? "bn" : "en";
  const selectedMatches = filteredMatches(req.query);
  const generatedAt = nowUtcStamp();
  const title = lang === "bn" ? "Khela Calendar - বিশ্বকাপ ২০২৬" : "Khela Calendar - World Cup 2026";

  const events = selectedMatches.map((match) => {
    const home = displayTeam(match.team_a, lang);
    const away = displayTeam(match.team_b, lang);
    const isKnockout = !/^Group /.test(match.group);
    const duration = isKnockout ? 180 : 140;
    const summary = `${home} vs ${away}`;
    const description = [
      `${match.group}`,
      `${match.venue}, ${match.city}`,
      "Bangladesh time is handled automatically by your calendar app.",
      "Fan-made by Khela Calendar. Not affiliated with FIFA.",
    ].join("\n");

    return [
      "BEGIN:VEVENT",
      `UID:khela-calendar-match-${match.match}@khela-calendar`,
      `DTSTAMP:${generatedAt}`,
      `DTSTART:${toUtcStamp(match.date_utc, match.kickoff_utc)}`,
      `DTEND:${addMinutes(match.date_utc, match.kickoff_utc, duration)}`,
      foldLine(`SUMMARY:${escapeIcs(summary)}`),
      foldLine(`DESCRIPTION:${escapeIcs(description)}`),
      foldLine(`LOCATION:${escapeIcs(`${match.venue}, ${match.city}, ${match.host_country}`)}`),
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    ].join("\r\n");
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Khela Calendar//World Cup 2026 BD//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeIcs(title)}`),
    "X-WR-TIMEZONE:Asia/Dhaka",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  res.setHeader("Content-Disposition", 'inline; filename="khela-calendar-world-cup-2026.ics"');
  res.status(200).send(calendar);
};
