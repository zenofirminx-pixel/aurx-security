// core/decisionEngine.js

import { setCooldown } from "../security/cooldowns.js";

/**
 * Analyse les données du tracker
 */
export function decisionEngine(data) {
  const { ip, count, avgInterval } = data;

  let status = "normal";
  let cooldown = 0;
  let reason = "ok";

  // 🟡 SUSPECT
  if (count >= 9 && count <= 15) {
    status = "suspect";
    reason = "activité rapide détectée";
  }

  // 🟠 ABUS
  if (count >= 16 && count <= 22) {
    status = "abuse";
    cooldown = 60 * 1000; // 1 minute
    reason = "abus probable détecté";

    setCooldown(ip, cooldown);
  }

  // 🔴 BLOCK
  if (count >= 23) {
    status = "blocked";
    cooldown = 5 * 60 * 1000; // 5 minutes
    reason = "spam/bot détecté";

    setCooldown(ip, cooldown);
  }

  // 🧠 BONUS LOGIQUE (vitesse extrême)
  if (avgInterval !== 0 && avgInterval < 150) {
    // très rapide (moins de 150ms entre requêtes)
    if (count >= 10) {
      status = "abuse";
      cooldown = 2 * 60 * 1000;
      reason = "burst ultra rapide détecté";

      setCooldown(ip, cooldown);
    }
  }

  return {
    ip,
    status,
    count,
    avgInterval,
    cooldown,
    reason,
  };
}