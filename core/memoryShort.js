// core/memoryShort.js

const shortMemory = new Map();

/**
 * récupère ou crée la mémoire d'une IP
 */
function get(ip) {
  if (!shortMemory.has(ip)) {
    shortMemory.set(ip, []);
  }
  return shortMemory.get(ip);
}

/**
 * ajoute une requête + nettoie les anciennes (>10s)
 */
export function addRequest(ip) {
  const now = Date.now();
  let data = get(ip);

  data.push(now);

  // garder seulement les 10 dernières secondes
  data = data.filter((t) => now - t <= 10000);

  shortMemory.set(ip, data);

  return data;
}

/**
 * retourne les stats de l'IP
 */
export function getStats(ip) {
  const data = get(ip);

  let avgInterval = 0;

  if (data.length > 1) {
    const intervals = [];

    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i] - data[i - 1]);
    }

    avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  return {
    count: data.length,
    timestamps: data,
    avgInterval,
  };
}

/**
 * reset si besoin
 */
export function reset(ip) {
  shortMemory.delete(ip);
}