import { getTracker } from "./tracker.js";

export function evaluatePolicy(ip, stats, rules) {
  const tracker = getTracker(ip);

  let score = 0;

  // 🚀 trop rapide
  if (stats.avgInterval < rules.minIntervalMs) {
    score += 3;
  }

  // 🚀 trop de requêtes
  if (stats.count > rules.maxRequestsPerMinute) {
    score += 4;
  }

  // 🚀 comportement suspect
  if (tracker.score > 10) {
    score += 5;
  }

  // 🚀 IP blacklist
  if (rules.blacklist?.includes(ip)) {
    return {
      status: "blocked",
      reason: "blacklisted ip",
      score: 100,
    };
  }

  // décisions
  if (score >= 7) {
    return {
      status: "blocked",
      reason: "high risk detected",
      score,
    };
  }

  if (score >= 4) {
    return {
      status: "abuse",
      reason: "rate limited",
      score,
    };
  }

  return {
    status: "ok",
    score,
  };
}