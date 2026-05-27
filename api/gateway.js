import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";

export default function handler(req, res) {
  try {
    const ip = "debug-ip";

    console.log("1 OK");

    addRequest(ip);
    console.log("2 OK");

    const stats = getStats(ip);
    console.log("3 OK", stats);

    const decision = decisionEngine({
      ip,
      count: stats?.count ?? 0,
      avgInterval: stats?.avgInterval ?? 0,
    });

    console.log("4 OK", decision);

    return res.status(200).json({
      ok: true,
      stats,
      decision,
    });

  } catch (err) {
    console.log("CRASH HERE:", err);

    return res.status(500).json({
      error: err.message,
      step: "gateway crash",
    });
  }
}