export default function handler(req, res) {
  return res.status(200).json({
    status: "alive",
    system: "AurX Security API",
    time: Date.now(),
  });
}