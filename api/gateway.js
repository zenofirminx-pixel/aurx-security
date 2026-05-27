import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";

const AI_BACKEND = "https://aur-x-backend.vercel.app/api/chat";

export default async function handler(req, res) {
  try {
    // 🌐 IP user
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // 📦 SAFE BODY PARSING (IMPORTANT)
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const message = body.message;

    // ❌ validation
    if (!message) {
      return res.status(400).json({
        status: "error",
        reason: "message manquant",
      });
    }

    // 📡 TRACKER (protégé)
    let stats = { count: 0, avgInterval: 0 };

    try {
      addRequest(ip);
      stats = getStats(ip);
    } catch (e) {
      // si memory casse → on continue quand même
      stats = { count: 1, avgInterval: 0 };
    }

    // 🧠 DECISION ENGINE (protégé)
    let decision = {
      status: "ok",
      reason: "default",
    };

    try {
      decision = decisionEngine({
        ip,
        count: stats.count,
        avgInterval: stats.avgInterval,
      });
    } catch (e) {
      decision = { status: "ok", reason: "engine fallback" };
    }

    // ⛔ BLOCK
    if (decision.status === "blocked") {
      return res.status(403).json({
        status: "blocked",
        reason: decision.reason,
      });
    }

    if (decision.status === "abuse") {
      return res.status(429).json({
        status: "limited",
        reason: decision.reason,
      });
    }

    // 🤖 CALL BACKEND IA (protégé)
    let aiData = null;

    try {
      const aiResponse = await fetch(AI_BACKEND, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          ip,
          meta: stats,
        }),
      });

      aiData = await aiResponse.json();
    } catch (e) {
      aiData = {
        error: "AI backend unreachable",
        message: e.message,
      };
    }

    // 📤 RESPONSE FINALE
    return res.status(200).json({
      status: "ok",
      security: decision.status,
      stats,
      response: aiData,
    });

  } catch (err) {
    // 🧯 CATASTROPHE SAFE FALLBACK
    return res.status(500).json({
      status: "error",
      message: "gateway crashed",
      error: err.message,
    });
  }
}