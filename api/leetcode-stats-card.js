export default async function handler(req, res) {
  const { username = 'anonymous', theme = 'algolia', hide_border = 'false' } = req.query;

  // GraphQL запрос к публичному API LeetCode
  const query = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      allQuestionsCount {
        difficulty
        count
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } })
    });

    const { data } = await response.json();

    if (!data.matchedUser) {
      return res.status(404).send('User not found');
    }

    // Подсчет решенных задач
    const solved = data.matchedUser.submitStats.acSubmissionNum.reduce((sum, item) => sum + item.count, 0);
    const total = data.allQuestionsCount.reduce((sum, item) => sum + item.count, 0);

    // Расчет процентов для прогресс-баров (с округлением до целых)
    const easyTotal = data.allQuestionsCount.find(q => q.difficulty === 'Easy').count;
    const mediumTotal = data.allQuestionsCount.find(q => q.difficulty === 'Medium').count;
    const hardTotal = data.allQuestionsCount.find(q => q.difficulty === 'Hard').count;

    const easySolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Easy').count;
    const mediumSolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Medium').count;
    const hardSolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Hard').count;

    const easyPercent = Math.round((easySolved / easyTotal) * 100);
    const mediumPercent = Math.round((mediumSolved / mediumTotal) * 100);
    const hardPercent = Math.round((hardSolved / hardTotal) * 100);

    // Цвета в зависимости от темы
    const colors = theme === 'dark'
      ? { bg: '#1e293b', text: '#f1f5f9', easy: '#4ade80', medium: '#fbbf24', hard: '#ef4444' }
      : { bg: '#f8fafc', text: '#1e293b', easy: '#22c55e', medium: '#eab308', hard: '#dc2626' };

    const borderStyle = hide_border === 'true' ? 'none' : '1px solid #e2e8f0';

    // Генерация SVG
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" style="background:${colors.bg}; border:${borderStyle}; border-radius:8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
      <text x="20" y="30" fill="${colors.text}" font-size="18" font-weight="bold">${username} на LeetCode</text>

      <!-- Всего решено -->
      <text x="20" y="55" fill="${colors.text}" font-size="14">Решено: ${solved} / ${total}</text>
      <rect x="20" y="60" width="360" height="8" rx="4" fill="#cbd5e1" opacity="0.2"></rect>
      <rect x="20" y="60" width="${(solved / total) * 360}" height="8" rx="4" fill="${colors.text}" opacity="0.4"></rect>

      <!-- Easy -->
      <text x="20" y="80" fill="${colors.easy}" font-size="14">Easy: ${easySolved} (${easyPercent}%)</text>
      <rect x="20" y="85" width="360" height="6" rx="3" fill="#d1fae5" opacity="0.3"></rect>
      <rect x="20" y="85" width="${easyPercent * 3.6}" height="6" rx="3" fill="${colors.easy}"></rect>

      <!-- Medium -->
      <text x="20" y="96" fill="${colors.medium}" font-size="14">Medium: ${mediumSolved} (${mediumPercent}%)</text>
      <rect x="20" y="101" width="360" height="6" rx="3" fill="#fef3c7" opacity="0.3"></rect>
      <rect x="20" y="101" width="${mediumPercent * 3.6}" height="6" rx="3" fill="${colors.medium}"></rect>

      <!-- Hard -->
      <text x="20" y="112" fill="${colors.hard}" font-size="14">Hard: ${hardSolved} (${hardPercent}%)</text>
      <rect x="20" y="117" width="360" height="6" rx="3" fill="#fed7d7" opacity="0.3"></rect>
      <rect x="20" y="117" width="${hardPercent * 3.6}" height="6" rx="3" fill="${colors.hard}"></rect>
    </svg>`.replace(/\s{2,}/g, ' ').trim();

    // Vercel по умолчанию отдает application/json, нужно принудительно указать image/svg+xml
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600'); // Кэширование на CDN
    res.send(svg);

  } catch (error) {
    res.status(500).send('Error fetching data');
  }
}