import gateway from "./gateway.js";

/**
 * Endpoint IA AurX
 */
export default function handler(req, res) {
  // 🛡 sécurité obligatoire
  const gate = gateway(req, res);

  // si gateway bloque → arrêt
  if (!gate || gate.blocked) return;

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      error: "message manquant",
    });
  }

  // 🤖 placeholder IA (plus tard remplacé par vrai moteur)
  const response = `AurX répond à: ${message}`;

  return res.status(200).json({
    status: "ok",
    input: message,
    response,
  });
}