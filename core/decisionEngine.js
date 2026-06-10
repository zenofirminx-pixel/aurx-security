export function decisionEngine({ ip, count, avgInterval, rules }) {
  if (count > rules.maxRequestsPerMinute) {
    return { status: "abuse", reason: "rate limit" };
  }

  if (avgInterval < rules.minIntervalMs) {
    return { status: "abuse", reason: "too fast requests" };
  }

  if (rules.blacklist?.includes(ip)) {
    return { status: "blocked", reason: "blacklisted IP" };
  }

  return { status: "ok" };
}