import { parse } from "cookie";

export const config = { maxDuration: 60 };

const LIMIT_WINDOW = 2000;      // 2 sec
const BURST_LIMIT = 5;          // 5 messages
const BLOCK_TIME = 60 * 1000;   // 1 min
const MAX_SCORE = 30;

// ⚠️ mémoire simple en RAM (upgrade Firestore plus tard)
const memory = new Map();

function getUserState(userId) {
  if (!memory.has(userId)) {
    memory.set(userId, {
      score: 0,
      lastMessages: [],
      punishUntil: 0
    });
  }
  return memory.get(userId);
}

function send(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default async function handler(req, res) {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 USER ID
    const cookies = parse(req.headers.cookie || "");
    let userId = "guest";

    if (cookies.aurx_session) {
      try {
        const user = JSON.parse(
          Buffer.from(cookies.aurx_session, "base64").toString()
        );
        userId = user.sid || user.id || "guest";
      } catch {}
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const message = body.message?.trim();
    const convId = body.convId;

    if (!message || !convId) {
      send(res, { error: "Missing fields" });
      return res.end();
    }

    const now = Date.now();
    const state = getUserState(userId);

    // 🔴 BLOCK CHECK
    if (state.punishUntil > now) {
      send(res, {
        error: "Trop de requêtes détectées. Réessaie plus tard."
      });
      return res.end();
    }

    // 🧠 CLEAN OLD DATA
    state.lastMessages = state.lastMessages.filter(
      t => now - t < 60000
    );

    state.lastMessages.push(now);

    // 🚨 BURST DETECTION
    const recent = state.lastMessages.slice(-BURST_LIMIT);
    if (
      recent.length === BURST_LIMIT &&
      now - recent[0] < LIMIT_WINDOW
    ) {
      state.score += 10;
    }

    // 🧮 GENERAL SPAM SCORE
    if (state.lastMessages.length > 12) {
      state.score += 5;
    }

    // ⚠️ DECISION ENGINE
    if (state.score >= MAX_SCORE) {
      state.punishUntil = now + 10 * 60 * 1000; // 10 min
      send(res, { error: "Compte temporairement bloqué" });
      return res.end();
    }

    if (state.score >= 15) {
      state.punishUntil = now + BLOCK_TIME;
    }

    // 🔗 FORWARD TO AI BACKEND
    const aiRes = await fetch("https://aur-x-backend.vercel.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || ""
      },
      body: JSON.stringify({ message, convId })
    });

    if (!aiRes.ok || !aiRes.body) {
      send(res, { error: "AI backend unavailable" });
      return res.end();
    }

    // 🚀 STREAM PIPE (SSE PROXY)
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let fullReply = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;

        const data = line.replace("data:", "").trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const content = json.content || "";

          if (content) {
            fullReply += content;
            send(res, { content });
          }
        } catch {}
      }
    }

    send(res, { done: true });
    res.end();

  } catch (err) {
    console.error("SECURE GATEWAY ERROR:", err);
    try {
      send(res, { error: "Server error" });
      res.end();
    } catch {}
  }
}