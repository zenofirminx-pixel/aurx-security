import { evaluatePolicy } from "./policy.js";

export function decisionEngine({ ip, count, avgInterval, rules }) {
  const stats = {
    count,
    avgInterval,
  };

  return evaluatePolicy(ip, stats, rules);
}