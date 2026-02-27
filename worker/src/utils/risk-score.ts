export function calculateRiskScore(params: {
  reportCount: number;
  recentReportsCount: number;
  totalLostUsd: number;
  lastReportedAt: string | null;
}): number {
  const { reportCount, recentReportsCount, totalLostUsd, lastReportedAt } = params;

  const base = Math.min(60, reportCount * 15);
  const frequency = recentReportsCount >= 3 ? 20 : 0;

  let amount = 0;
  if (totalLostUsd > 100000) amount = 20;
  else if (totalLostUsd > 10000) amount = 10;

  let recency = 0;
  if (lastReportedAt) {
    const hoursSince = (Date.now() - new Date(lastReportedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince <= 24) recency = 10;
  }

  return Math.min(100, base + frequency + amount + recency);
}
