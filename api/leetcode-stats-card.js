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

    const koefLength = 2 * 3.14159 * 27.5 / 40;
    const r = 70;
    const ringLength = 2 * 3.14159 * r;
    const ringAngleOffset = 135;
    const deltaOffset = 2 * 3.14159 * r * 1.25 / 40;

    const easyTotalLength = koefLength * r * easyTotal / total;
    const easyLength = koefLength * r * easySolved / total;

    const mediumAngleOffset = Math.round(ringAngleOffset + (easyTotalLength + deltaOffset) * 360 / ringLength);
    const mediumTotalLength = koefLength * r * mediumTotal / total;
    const mediumLength = koefLength * r * mediumSolved / total;

    const hardAngleOffset = Math.round(ringAngleOffset + (easyTotalLength + mediumTotalLength + 2 * deltaOffset) * 360 / ringLength);
    const hardTotalLength = koefLength * r * hardTotal / total;
    const hardLength = koefLength * r * hardSolved / total;

    // Colors based on leetcode
    const colors = theme === 'dark'
        ? { bg: 'rgb(40, 40, 40)', blockColor: 'rgb(53, 53, 53)',
                text: 'rgb(255, 255, 255)', green: 'rgb(2, 151, 39)',
                easy: 'rgb(28, 186, 186)', easyRing: 'rgb(38, 69, 69)',
                medium: 'rgb(255, 183, 0)', mediumRing: 'rgb(83, 69, 32)',
                hard: 'rgb(246, 55, 55)', hardRing: 'rgb(81, 43, 43)' }
        : { bg: '#f8fafc', text: '#1e293b', easy: '#22c55e', easyRing: 'rgb(38, 69, 69)', medium: '#eab308', hard: '#dc2626' };

        const borderStyle = hide_border === 'true' ? 'none' : '1px solid #e2e8f0';

        // SVG with circle diagram
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="165"
                style="background:${colors.bg}; border:${borderStyle}; border-radius:8px; overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
            <!-- Круговая диаграмма -->
            <g transform="translate(140, 90)">
                // easy stroke
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.easyRing}" stroke-width="6"
                    stroke-dasharray="${easyTotalLength} ${ringLength - easyTotalLength}" stroke-dashoffset="0" transform="rotate(135)" stroke-linecap="round"/>
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.easy}" stroke-width="6"
                    stroke-dasharray="${easyLength} ${ringLength - easyLength}" stroke-dashoffset="0" transform="rotate(135)" stroke-linecap="round"/>
                // medium stroke
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.mediumRing}" stroke-width="6"
                    stroke-dasharray="${mediumTotalLength} ${ringLength - mediumTotalLength}" stroke-dashoffset="0" transform="rotate(${mediumAngleOffset})" stroke-linecap="round"/>
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.medium}" stroke-width="6"
                    stroke-dasharray="${mediumLength} ${ringLength - mediumLength}" stroke-dashoffset="0" transform="rotate(${mediumAngleOffset})" stroke-linecap="round"/>
                // hard stroke
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.hardRing}" stroke-width="6"
                    stroke-dasharray="${hardTotalLength} ${ringLength - hardTotalLength}" stroke-dashoffset="0" transform="rotate(${hardAngleOffset})" stroke-linecap="round"/>
                <circle r="${r}" cx="0" cy="0" fill="none" stroke="${colors.hard}" stroke-width="6"
                    stroke-dasharray="${hardLength} ${ringLength - hardLength}" stroke-dashoffset="0" transform="rotate(${hardAngleOffset})" stroke-linecap="round"/>

                <!-- Текст в центре -->
                <text x="-20" y="0" fill="${colors.text}" font-size="28" font-weight="bold" text-anchor="middle">${solved}</text>
                <text x="28" y="0" fill="${colors.text}" font-size="14" text-anchor="middle">/ ${total}</text>
                <text x="-18" y="20" fill="${colors.green}" font-size="14" font-weight="bold" text-anchor="middle">✓</text>
                <text x="7" y="20" fill="${colors.text}" font-size="12" text-anchor="middle">Solved</text>
            </g>

            <!-- Блок Easy -->
            <g transform="translate(275, 15)">
                <rect x="0" y="-5" width="100" height="40" rx="8" ry="8" fill="${colors.blockColor}" stroke="..." stroke-width="..." />
                <text x="50" y="10" fill="${colors.easy}" font-size="12" text-anchor="middle">Easy</text>
                <text x="50" y="30" fill="${colors.text}" font-size="12" text-anchor="middle">${easySolved}/${easyTotal}</text>
            </g>

            <!-- Блок Medium -->
            <g transform="translate(275, 65)">
                <rect x="0" y="-5" width="100" height="40" rx="8" ry="8" fill="${colors.blockColor}" stroke="..." stroke-width="..." />
                <text x="50" y="10" fill="${colors.medium}" font-size="14" text-anchor="middle">Med.</text>
                <text x="50" y="30" fill="${colors.text}" font-size="14" text-anchor="middle">${mediumSolved}/${mediumTotal}</text>
            </g>

            <!-- Блок Hard -->
            <g transform="translate(275, 115)">
                <rect x="0" y="-5" width="100" height="40" rx="8" ry="8" fill="${colors.blockColor}" stroke="..." stroke-width="..." />
                <text x="50" y="10" fill="${colors.hard}" font-size="14" text-anchor="middle">Hard</text>
                <text x="50" y="30" fill="${colors.text}" font-size="14" text-anchor="middle">${hardSolved}/${hardTotal}</text>
            </g>
        </svg>`.replace(/\s{2,}/g, ' ').trim();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600');
        res.send(svg);

  } catch (error) {
    res.status(500).send('Error fetching data');
  }
}