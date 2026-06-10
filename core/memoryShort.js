const memory = new Map();

export function addRequest(ip) {
  const now = Date.now();

  if (!memory.has(ip)) {
    memory.set(ip, []);
  }

  const arr = memory.get(ip);
  arr.push(now);

  // keep last 20 requests
  if (arr.length > 20) arr.shift();

  memory.set(ip, arr);
}

export function getStats(ip) {
  const arr = memory.get(ip) || [];

  if (arr.length < 2) {
    return { count: arr.length, avgInterval: 0 };
  }

  let intervals = [];
  for (let i = 1; i < arr.length; i++) {
    intervals.push(arr[i] - arr[i - 1]);
  }

  const avgInterval =
    intervals.reduce((a, b) => a + b, 0) / intervals.length;

  return {
    count: arr.length,
    avgInterval,
  };
}