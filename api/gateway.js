import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";

const AI_BACKEND = "https://aur-x-backend.vercel.app/api/chat";

export default async function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  const { message } = req.body;

  // 📡 1. tracker
  const stats = addRequest(ip);

  // 📊 2. analyse
  const analysis = getStats(ip);

  const decision = decisionEngine({
    ip,
    count: analysis.count,
    avgInterval: analysis.avgInterval,
  });

  // ⛔ 3. blocage
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

  // ⚠️ 4. suspect mais autorisé
  if (!message) {
    return res.status(400).json({ error: "message manquant" });
  }

  // 🤖 5. FORWARD vers backend IA
  const aiResponse = await fetch(AI_BACKEND, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      ip,
      meta: analysis,
    }),
  });

  const data = await aiResponse.json();

  // 📤 6. réponse finale
  return res.status(200).json({
    status: "ok",
    security: decision.status,
    response: data,
  });
}