import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";

const AI_BACKEND = "https://aur-x-backend.vercel.app/api/chat";

export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message = body.message;

    if (!message) {
      return res.status(400).json({ error: "message manquant" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // 🟢 1. MEMORY SHORT (tracking)
    try {
      addRequest(ip);
    } catch (e) {
      console.log("memoryShort error:", e.message);
    }

    const stats = getStats(ip || "unknown");

    // 🟡 2. DECISION ENGINE
    let decision = { status: "ok" };

    try {
      decision = decisionEngine({
        ip,
        count: stats?.count || 0,
        avgInterval: stats?.avgInterval || 0,
      });
    } catch (e) {
      console.log("decisionEngine error:", e.message);
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

    // 🔵 3. AI CALL
    const aiResponse = await fetch(AI_BACKEND, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        ip,
        stats,
      }),
    });

    const data = await aiResponse.json();

    return res.status(200).json({
      status: "ok",
      security: decision.status,
      response: data,
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      error: err.message,
    });
  }
}