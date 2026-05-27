// core/tracker.js

const memory = new Map();

/**
 * Initialise ou récupère les données d'une IP
 */
function getIPData(ip) {
  if (!memory.has(ip)) {
    memory.set(ip, []);
  }
  return memory.get(ip);
}

/**
 * Nettoie les anciens timestamps (> 10 secondes)
 */
function cleanOldRequests(timestamps, windowMs = 10000) {
  const now = Date.now();
  return timestamps.filter((t) => now - t <= windowMs);
}

/**
 * Analyse une requête entrante
 */
export function trackRequest(ip) {
  const now = Date.now();

  // 1. récupérer historique IP
  let timestamps = getIPData(ip);

  // 2. ajouter nouvelle requête
  timestamps.push(now);

  // 3. garder seulement les 10 dernières secondes
  timestamps = cleanOldRequests(timestamps, 10000);

  // 4. sauvegarder
  memory.set(ip, timestamps);

  // 5. calculer métriques
  const count = timestamps.length;

  // 6. calcul simple de vitesse moyenne
  let avgInterval = 0;

  if (timestamps.length > 1) {
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  // 7. retourner état brut
  return {
    ip,
    count, // N requêtes sur 10s
    timestamps,
    avgInterval, // vitesse moyenne
  };
                    }
