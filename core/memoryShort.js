const shortMemory = new Map();

function get(ip) {
  if (!shortMemory.has(ip)) {
    shortMemory.set(ip, []);
  }
  return shortMemory.get(ip);
}

export function addRequest(ip) {
  const now = Date.now();

  const data = get(ip);

  data.push(now);

  // clean safe
  const cleaned = data.filter((t) => now - t <= 10000);

  shortMemory.set(ip, cleaned);

  return cleaned;
}

export function getStats(ip) {
  const data = get(ip) || [];

  if (data.length < 2) {
    return {
      count: data.length,
      avgInterval: 0,
      timestamps: data,
    };
  }

  let sum = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    sum += diff;
  }

  const avgInterval = sum / (data.length - 1);

  return {
    count: data.length,
    avgInterval: isNaN(avgInterval) ? 0 : avgInterval,
    timestamps: data,
  };
}

export function reset(ip) {
  shortMemory.delete(ip);
}