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

    // Data
    const solved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'All').count;
    const total = data.allQuestionsCount.find(q => q.difficulty === 'All').count;
    const percent = Math.round((solved / total) * 100);

    const easyTotal = data.allQuestionsCount.find(q => q.difficulty === 'Easy').count;
    const mediumTotal = data.allQuestionsCount.find(q => q.difficulty === 'Medium').count;
    const hardTotal = data.allQuestionsCount.find(q => q.difficulty === 'Hard').count;

    const easySolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Easy').count;
    const mediumSolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Medium').count;
    const hardSolved = data.matchedUser.submitStats.acSubmissionNum.find(q => q.difficulty === 'Hard').count;

    const easyPercent = Math.round((easySolved / easyTotal) * 100);
    const mediumPercent = Math.round((mediumSolved / mediumTotal) * 100);
    const hardPercent = Math.round((hardSolved / hardTotal) * 100);

    // Colors based on leetcode
    const colors = theme === 'dark'
        ? { bg: 'rgb(40, 40, 40)', text: 'rgb(255, 255, 255)', easy: 'rgb(28, 186, 186)', easyRing: 'rgb(38, 69, 69)',
                                                                medium: 'rgb(255, 183, 0)', mediumRing: 'rgb(83, 69, 32)',
                                                                hard: 'rgb(246, 55, 55)', hardRing: 'rgb(81, 43, 43)', ring: '#374151' }
        : { bg: '#f8fafc', text: '#1e293b', easy: '#22c55e', easyRing: 'rgb(38, 69, 69)', medium: '#eab308', hard: '#dc2626', ring: '#e5e7eb' };

        const borderStyle = hide_border === 'true' ? 'none' : '1px solid #e2e8f0';

        // SVG с круговой диаграммой
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" style="background:${colors.bg}; border:${borderStyle}; border-radius:8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
            <!-- Круговая диаграмма -->
            <g transform="translate(100, 80)">
                <!-- Фон кольца -->
                <circle r="60" cx="0" cy="0" fill="none" stroke="${colors.ring}" stroke-width="8" />
                <!-- Дуга прогресса (общая) -->
                <circle r="60" cx="0" cy="0" fill="none" stroke="${colors.text}" stroke-width="8" stroke-dasharray="${percent * 3.77} 251.33"
                    stroke-dashoffset="0" transform="rotate(-90)" />

                <!-- Текст в центре -->
                <text x="0" y="10" fill="${colors.text}" font-size="28" font-weight="bold" text-anchor="middle">${solved}</text>
                <text x="0" y="35" fill="${colors.text}" font-size="14" text-anchor="middle">/ ${total}</text>
                <text x="0" y="55" fill="${colors.easy}" font-size="12" text-anchor="middle">Solved</text>
            </g>

            <!-- Блок Easy -->
            <g transform="translate(220, 50)">
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.ring}" stroke-width="4" />
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.easy}" stroke-width="4"
                    stroke-dasharray="${easyPercent * 1.57} 100.53" stroke-dashoffset="0" transform="rotate(-90)" />
                <text x="0" y="10" fill="${colors.easy}" font-size="14" text-anchor="middle">${easySolved}</text>
                <text x="0" y="30" fill="${colors.easy}" font-size="12" text-anchor="middle">Easy</text>
            </g>

            <!-- Блок Medium -->
            <g transform="translate(220, 110)">
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.ring}" stroke-width="4" />
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.medium}" stroke-width="4"
                    stroke-dasharray="${mediumPercent * 1.57} 100.53" stroke-dashoffset="0" transform="rotate(-90)" />
                <text x="0" y="10" fill="${colors.medium}" font-size="14" text-anchor="middle">${mediumSolved}</text>
                <text x="0" y="30" fill="${colors.medium}" font-size="12" text-anchor="middle">Med.</text>
            </g>

            <!-- Блок Hard -->
            <g transform="translate(220, 170)">
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.ring}" stroke-width="4" />
                <circle r="25" cx="0" cy="0" fill="none" stroke="${colors.hard}" stroke-width="4"
                    stroke-dasharray="${hardPercent * 1.57} 100.53" stroke-dashoffset="0" transform="rotate(-90)" />
                <text x="0" y="10" fill="${colors.hard}" font-size="14" text-anchor="middle">${hardSolved}</text>
                <text x="0" y="30" fill="${colors.hard}" font-size="12" text-anchor="middle">Hard</text>
            </g>
        </svg>`.replace(/\s{2,}/g, ' ').trim();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600');
        res.send(svg);

  } catch (error) {
    res.status(500).send('Error fetching data');
  }
}