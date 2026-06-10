const state = {
  lang: localStorage.getItem("khela-lang") || "en",
  mode: "all",
  filter: "next",
  selected: new Set(),
  teams: [],
  matches: [],
};

const els = {
  teamGrid: document.querySelector("#team-grid"),
  teamSearch: document.querySelector("#team-search"),
  selectedStrip: document.querySelector("#selected-strip"),
  includeKnockouts: document.querySelector("#include-knockouts"),
  feedUrl: document.querySelector("#feed-url"),
  appleBtn: document.querySelector("#apple-btn"),
  googleBtn: document.querySelector("#google-btn"),
  copyBtn: document.querySelector("#copy-btn"),
  icsLink: document.querySelector("#ics-link"),
  matchList: document.querySelector("#match-list"),
  featuredTeamSelect: document.querySelector("#featured-team-select"),
  featuredSummary: document.querySelector("#featured-summary"),
  featuredMatchList: document.querySelector("#featured-match-list"),
  toast: document.querySelector("#toast"),
};

const copy = {
  en: {
    allSelected: "All 104 matches selected",
    noTeam: "Choose at least one team.",
    feedReady: "Calendar feed ready",
    copied: "Calendar URL copied",
    shareTitle: "Khela Calendar",
    shareText: "World Cup 2026 match calendar for Bangladesh fans",
    nextMatches: "Next matches",
    noMatches: "No matches found.",
  },
  bn: {
    allSelected: "সব ১০৪টি ম্যাচ নির্বাচিত",
    noTeam: "কমপক্ষে একটি দল বাছাই করুন।",
    feedReady: "ক্যালেন্ডার ফিড প্রস্তুত",
    copied: "ক্যালেন্ডার URL কপি হয়েছে",
    shareTitle: "Khela Calendar",
    shareText: "বাংলাদেশি ফুটবল ফ্যানদের জন্য বিশ্বকাপ ২০২৬ ম্যাচ ক্যালেন্ডার",
    nextMatches: "পরের ম্যাচগুলো",
    noMatches: "কোনো ম্যাচ পাওয়া যায়নি।",
  },
};

function localMatchDate(match) {
  return new Date(`${match.date_utc}T${match.kickoff_utc}:00Z`);
}

function formatBdDate(date) {
  return new Intl.DateTimeFormat(state.lang === "bn" ? "bn-BD" : "en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCount(value) {
  if (state.lang === "bn") return new Intl.NumberFormat("bn-BD").format(value);
  return String(value);
}

function formatBdTime(date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
  const label =
    hour >= 4 && hour <= 6
      ? state.lang === "bn"
        ? "ভোর"
        : "Early morning"
      : hour >= 7 && hour <= 10
        ? state.lang === "bn"
          ? "সকাল"
          : "Morning"
        : state.lang === "bn"
          ? "রাত"
          : "Night";
  const time = new Intl.DateTimeFormat(state.lang === "bn" ? "bn-BD" : "en-US", {
    timeZone: "Asia/Dhaka",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const localizedTime = state.lang === "bn" ? time.replace("AM", "এএম").replace("PM", "পিএম") : time;
  return `${label} ${localizedTime}`;
}

function teamInfo(name) {
  return state.teams.find((team) => team.name === name) || {
    name,
    bn: name,
    flag: name === "TBD" ? "🏆" : "",
    code: name,
  };
}

function teamLabel(name) {
  const team = teamInfo(name);
  if (state.lang === "bn") return `${team.flag} ${team.bn}`;
  return `${team.flag} ${team.name}`;
}

function baseUrl() {
  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin;
  }
  return "https://khela-calendar.vercel.app";
}

function feedPath() {
  const params = new URLSearchParams();
  params.set("scope", state.mode);
  params.set("lang", state.lang);

  if (state.mode === "teams") {
    params.set("teams", Array.from(state.selected).join(","));
    if (els.includeKnockouts.checked) params.set("knockouts", "1");
  }

  return `/api/calendar?${params.toString()}`;
}

function downloadFeedPath() {
  const url = new URL(feedPath(), baseUrl());
  url.searchParams.set("download", "1");
  return `${url.pathname}${url.search}`;
}

function feedUrl() {
  return `${baseUrl()}${feedPath()}`;
}

function webcalFeedUrl() {
  return feedUrl().replace(/^https?:\/\//, "webcal://");
}

function googleSubscribeUrl() {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalFeedUrl())}`;
}

function androidGoogleIntentUrl() {
  const cid = encodeURIComponent(webcalFeedUrl());
  const fallback = encodeURIComponent(googleSubscribeUrl());
  return `intent://calendar.google.com/calendar/render?cid=${cid}#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=${fallback};end`;
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function renderTeams() {
  const query = els.teamSearch.value.trim().toLowerCase();
  const visibleTeams = state.teams
    .filter((team) => team.name !== "TBD")
    .filter((team) => {
      const haystack = `${team.name} ${team.bn} ${team.code}`.toLowerCase();
      return haystack.includes(query);
    });

  els.teamGrid.innerHTML = visibleTeams
    .map((team) => {
      const active = state.selected.has(team.code) ? "active" : "";
      return `
        <button class="team-chip ${active}" data-code="${team.code}" type="button">
          <span class="flag">${team.flag}</span>
          <span>
            <strong>${state.lang === "bn" ? team.bn : team.name}</strong>
          </span>
        </button>
      `;
    })
    .join("");
}

function updateSelectedStrip() {
  if (state.mode === "all") {
    els.selectedStrip.textContent = copy[state.lang].allSelected;
    return;
  }

  if (state.selected.size === 0) {
    els.selectedStrip.textContent = copy[state.lang].noTeam;
    return;
  }

  const labels = Array.from(state.selected)
    .map((code) => state.teams.find((team) => team.code === code))
    .filter(Boolean)
    .map((team) => `${team.flag} ${state.lang === "bn" ? team.bn : team.name}`);

  els.selectedStrip.textContent = labels.join("  ·  ");
}

function updateActions() {
  const needsTeam = state.mode === "teams" && state.selected.size === 0;
  const url = feedUrl();

  els.feedUrl.textContent = needsTeam ? copy[state.lang].noTeam : `${copy[state.lang].feedReady}: ${url}`;
  els.icsLink.href = needsTeam ? "#" : downloadFeedPath();
  els.icsLink.setAttribute("download", "khela-calendar-world-cup-2026.ics");

  [els.appleBtn, els.googleBtn, els.copyBtn].forEach((button) => {
    button.disabled = needsTeam;
  });
  els.icsLink.classList.toggle("disabled", needsTeam);
}

function filteredMatches() {
  const now = new Date();
  let list = [...state.matches].sort((a, b) => localMatchDate(a) - localMatchDate(b));

  if (state.filter === "next") {
    list = list.filter((match) => localMatchDate(match) >= now).slice(0, 8);
  }

  if (state.filter === "night") {
    list = list.filter((match) => {
      const hour = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "numeric",
          hour12: false,
        }).format(localMatchDate(match)),
      );
      return hour >= 23 || hour <= 5;
    }).slice(0, 12);
  }

  if (state.filter === "all") list = list.slice(0, 32);
  return list;
}

function renderMatches() {
  const list = filteredMatches();

  if (!list.length) {
    els.matchList.innerHTML = `<p class="empty">${copy[state.lang].noMatches}</p>`;
    return;
  }

  els.matchList.innerHTML = list
    .map((match) => {
      const date = localMatchDate(match);
      return `
        <article class="match-card">
          <div class="match-time">
            <strong>${formatBdTime(date)}</strong>
            <span>${formatBdDate(date)}</span>
          </div>
          <div class="match-main">
            <h3>${teamLabel(match.team_a)} <span>vs</span> ${teamLabel(match.team_b)}</h3>
          </div>
          <div class="match-meta">
            <span>${match.group}</span>
            <span>${match.venue}, ${match.city}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFeaturedMatches() {
  if (!els.featuredTeamSelect || !els.featuredMatchList) return;
  const teamName = els.featuredTeamSelect.value || "Brazil";
  const team = teamInfo(teamName);
  const list = state.matches
    .filter((match) => match.team_a === teamName || match.team_b === teamName)
    .sort((a, b) => localMatchDate(a) - localMatchDate(b));

  els.featuredSummary.textContent =
    state.lang === "bn"
      ? `${team.flag} ${team.bn} · ${formatCount(list.length)} ম্যাচ`
      : `${team.flag} ${team.name} · ${list.length} matches`;

  if (!list.length) {
    els.featuredMatchList.innerHTML = `<p class="empty">${copy[state.lang].noMatches}</p>`;
    return;
  }

  els.featuredMatchList.innerHTML = list
    .map((match) => {
      const date = localMatchDate(match);
      return `
        <article class="featured-match-card">
          <div class="match-time">
            <strong>${formatBdTime(date)}</strong>
            <span>${formatBdDate(date)}</span>
          </div>
          <div class="match-main">
            <h3>${teamLabel(match.team_a)} <span>vs</span> ${teamLabel(match.team_b)}</h3>
          </div>
          <div class="match-meta">
            <span>${match.group}</span>
            <span>${match.venue}, ${match.city}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function refresh() {
  document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
  renderTeams();
  renderMatches();
  renderFeaturedMatches();
  updateSelectedStrip();
  updateActions();
}

async function init() {
  const [matches, teams] = await Promise.all([
    fetch("/data/matches.json").then((response) => response.json()),
    fetch("/data/teams.json").then((response) => response.json()),
  ]);

  state.matches = matches;
  state.teams = teams;
  refresh();
}

document.addEventListener("click", (event) => {
  const langButton = event.target.closest("[data-lang]");
  if (langButton) {
    state.lang = langButton.dataset.lang;
    localStorage.setItem("khela-lang", state.lang);
    refresh();
    return;
  }

  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    state.mode = modeButton.dataset.mode;
    refresh();
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    refresh();
    return;
  }

  const teamButton = event.target.closest("[data-code]");
  if (teamButton) {
    const code = teamButton.dataset.code;
    if (state.selected.has(code)) state.selected.delete(code);
    else state.selected.add(code);
    state.mode = "teams";
    refresh();
  }
});

els.teamSearch.addEventListener("input", renderTeams);
els.includeKnockouts.addEventListener("change", updateActions);
if (els.featuredTeamSelect) els.featuredTeamSelect.addEventListener("change", renderFeaturedMatches);

els.appleBtn.addEventListener("click", () => {
  window.location.href = feedUrl().replace(/^https?:\/\//, "webcal://");
});

els.googleBtn.addEventListener("click", () => {
  if (navigator.clipboard) navigator.clipboard.writeText(feedUrl()).catch(() => {});
  if (isAndroid()) {
    window.location.href = androidGoogleIntentUrl();
    showToast("Opening Google Calendar. Feed URL copied as backup.");
    return;
  }
  window.open(googleSubscribeUrl(), "_blank", "noopener,noreferrer");
  showToast("Google Calendar subscribe opened. Feed URL copied as backup.");
});

els.copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(feedUrl());
  showToast(copy[state.lang].copied);
});

document.querySelector("#share-site").addEventListener("click", async () => {
  const payload = {
    title: copy[state.lang].shareTitle,
    text: copy[state.lang].shareText,
    url: baseUrl(),
  };
  if (navigator.share) await navigator.share(payload);
  else {
    await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
    showToast(copy[state.lang].copied);
  }
});

init().catch(() => {
  els.matchList.innerHTML = '<p class="empty">Could not load match data.</p>';
});
