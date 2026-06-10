export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "aurx-secure-gateway",
    time: new Date().toISOString(),
  });
}