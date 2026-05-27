import { addRequest, getStats } from "../core/memoryShort.js";
import { decisionEngine } from "../core/decisionEngine.js";

export default async function handler(req, res) {
  try {
    const ip = "test-ip";

    console.log("STEP 1 OK");

    addRequest(ip);
    console.log("STEP 2 OK");

    const stats = getStats(ip);
    console.log("STEP 3 OK", stats);

    const decision = decisionEngine({
      ip,
      count: stats?.count || 0,
      avgInterval: stats?.avgInterval || 0,
    });

    console.log("STEP 4 OK", decision);

    return res.status(200).json({
      ok: true,
      stats,
      decision,
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message,
      step: "crash detected"
    });
  }
}