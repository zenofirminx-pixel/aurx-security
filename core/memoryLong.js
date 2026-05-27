// core/memoryLong.js

const longMemory = new Map();

/**
 * crée ou récupère un profil IP
 */
function get(ip) {
  if (!longMemory.has(ip)) {
    longMemory.set(ip, {
      abuseScore: 0,
      totalBlocks: 0,
      lastBlockTime: null,
      lastSeen: Date.now(),
    });
  }
  return longMemory.get(ip);
}

/**
 * augmente le score d'abus
 */
export function increaseAbuse(ip, value = 1) {
  const data = get(ip);
  data.abuseScore += value;
  data.lastSeen = Date.now();

  longMemory.set(ip, data);
  return data;
}

/**
 * enregistre un blocage
 */
export function registerBlock(ip) {
  const data = get(ip);

  data.totalBlocks += 1;
  data.lastBlockTime = Date.now();

  // escalade progressive
  if (data.totalBlocks >= 3) {
    data.abuseScore += 5;
  }

  longMemory.set(ip, data);

  return data;
}

/**
 * récupère profil complet
 */
export function getProfile(ip) {
  return get(ip);
}

/**
 * nettoyage des IPs inactives
 */
export function cleanup(maxAge = 60 * 60 * 1000) {
  const now = Date.now();

  for (const [ip, data] of longMemory.entries()) {
    if (now - data.lastSeen > maxAge) {
      longMemory.delete(ip);
    }
  }
}