export function isSame(e,t){if(void 0===e||void 0===t)return!1;let n=Object.keys(e),r=Object.keys(t);return n.length===r.length&&n.every(n=>e[n]===t[n])}