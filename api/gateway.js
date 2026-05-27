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

    const response = await fetch(AI_BACKEND, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    return res.status(200).json({
      status: "ok",
      response: data,
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}