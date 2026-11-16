const QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
  }
  allQuestionsCount { difficulty count }
}`;

const THEMES = {
  dark:  { bg: "#0d1117", card: "#161b22", text: "#c9d1d9", accent: "#58a6ff",
           easy: "#3fb950", medium: "#d29922", hard: "#f85149", bar: "#21262d" },
  light: { bg: "#ffffff", card: "#f6f8fa", text: "#24292f", accent: "#0969da",
           easy: "#1a7f37", medium: "#9a6700", hard: "#cf222e", bar: "#d0d7de" }
};

module.exports = async (req, res) => {
  const username = req.query.username;
  const theme = THEMES[req.query.theme] || THEMES.dark;
  const hideRanking = req.query.ranking === "off";

  if (!username) {
    res.status(400).send("нужен параметр ?username=ваш_ник");
    return;
  }

  let data;
  try {
    const r = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "leetcode-stats-card/1.0",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        operationName: "userPublicProfile",
        variables: { username },
        query: QUERY,
      }),
    });
    data = await r.json();
  } catch {
    res.status(502).send("LeetCode недоступен");
    return;
  }

  const u = data?.data?.matchedUser;
  if (!u) {
    res.status(404).send("профиль не найден");
    return;
  }

  const solved = {}, total = {};
  for (const { difficulty, count } of u.submitStats.acSubmissionNum)
    solved[difficulty] = count;
  for (const { difficulty, count } of data.data.allQuestionsCount)
    total[difficulty] = count;

  const bar = (label, s, t, color) => {
    const pct = t ? Math.min(100, Math.round((s / t) * 100)) : 0;
    const w = 340;
    return `
  <text x="30" y="${label.y}" fill="${theme.text}" font-size="14" font-weight="bold">${label.name}</text>
  <text x="370" y="${label.y}" fill="${theme.text}" font-size="14" text-anchor="end">${s} / ${t} (${pct}%)</text>
  <rect x="30" y="${label.y + 8}" width="${w}" height="12" rx="6" fill="${theme.bar}"/>
  <rect x="30" y="${label.y + 8}" width="${w * pct / 100}" height="12" rx="6" fill="${color}"/>`;
  };

  const rank = hideRanking ? "" : `
  <text x="30" y="182" fill="${theme.accent}" font-size="13">
    Рейтинг: ${u.profile?.ranking ?? "—"}
  </text>`;

  const svg = `
<svg width="400" height="${hideRanking ? 160 : 200}" xmlns="http://www.w3.org/2000/svg"
     font-family="Segoe UI, Helvetica, sans-serif">
  <rect width="400" height="${hideRanking ? 160 : 200}" rx="12" fill="${theme.bg}"/>
  <text x="30" y="42" fill="${theme.accent}" font-size="20" font-weight="bold">${u.username}</text>
  <text x="30" y="64" fill="${theme.text}" font-size="13">Прогресс LeetCode</text>
  ${bar({ name: "Easy",   y: 92 },  solved.Easy,   total.Easy,   theme.easy)}
  ${bar({ name: "Medium", y: 130 }, solved.Medium, total.Medium, theme.medium)}
  ${bar({ name: "Hard",   y: 168 }, solved.Hard,   total.Hard,   theme.hard)}
  ${rank}
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=3600");
  res.status(200).send(svg);
};