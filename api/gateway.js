import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";
import { RULES } from "../config/rules.js";

const AI_BACKEND = "https://aur-x-backend.vercel.app/api/chat";

export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "invalid message" });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    // 📊 tracking
    try {
      addRequest(ip);
    } catch {}

    const stats = getStats(ip) || { count: 0, avgInterval: 0 };

    // 🧠 decision engine
    let decision = { status: "ok" };

    try {
      decision = decisionEngine({
        ip,
        count: stats.count,
        avgInterval: stats.avgInterval,
        rules: RULES,
      });
    } catch {}

    if (decision.status === "blocked") {
      return res.status(403).json({ status: "blocked" });
    }

    if (decision.status === "abuse") {
      return res.status(429).json({ status: "limited" });
    }

    // 🚀 STREAM PASS THROUGH
    const response = await fetch(AI_BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ip, stats }),
    });

    if (!response.body) {
      return res.status(500).json({ error: "no stream" });
    }

    res.setHeader("Content-Type", "text/plain");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}