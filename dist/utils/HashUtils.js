import{weakLocalesFull as t}from"./locale.js";export function getEntryHash({sources:e}){return JSON.stringify(Object.fromEntries(Object.entries(e).flatMap(([e,r])=>{let n=e.split(",").filter(e=>!t.includes(e));return 0===n.length?[]:[[n.sort().join(","),r]]})))}