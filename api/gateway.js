import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";
import { getProfile, increaseAbuse } from "../core/memoryLong.js";
import { isOnCooldown } from "../security/cooldowns.js";

/**
 * AURX SECURITY GATEWAY (Vercel entry point)
 */
export default function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";

  // ⛔ 1. check cooldown global (si existant)
  if (isOnCooldown(ip)) {
    return res.status(429).json({
      status: "blocked",
      reason: "cooldown actif",
    });
  }

  // 📡 2. enregistrer requête (mémoire courte)
  addRequest(ip);

  // 📊 3. récupérer stats (10s window)
  const stats = getStats(ip);

  // 🧠 4. récupérer mémoire longue
  const profile = getProfile(ip);

  // ⚖️ 5. décision centrale
  const decision = decisionEngine({
    ip,
    count: stats.count,
    avgInterval: stats.avgInterval,
  });

  // 🚨 6. si suspect ou pire → enrichir mémoire longue
  if (decision.status === "suspect") {
    increaseAbuse(ip, 0.5);
  }

  if (decision.status === "abuse") {
    increaseAbuse(ip, 1);
  }

  if (decision.status === "blocked") {
    increaseAbuse(ip, 2);
  }

  // ⛔ 7. blocage
  if (decision.status === "blocked") {
    return res.status(403).json({
      status: "blocked",
      reason: decision.reason,
      cooldown: decision.cooldown,
    });
  }

  if (decision.status === "abuse") {
    return res.status(429).json({
      status: "limited",
      reason: decision.reason,
      cooldown: decision.cooldown,
    });
  }

  // ⚠️ 8. suspect (passage mais surveillé)
  if (decision.status === "suspect") {
    return res.status(200).json({
      status: "ok",
      warning: true,
      reason: decision.reason,
    });
  }

  // ✅ 9. normal → passage libre
  return res.status(200).json({
    status: "ok",
    data: "request accepted",
    stats,
  });
}