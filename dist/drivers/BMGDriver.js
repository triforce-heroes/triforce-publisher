import{readFileSync as r}from"node:fs";import{extract as e}from"@triforce-heroes/triforce-bmg/Extract";import{Driver as o}from"./Driver.js";export const BMGDriver=new class extends o{constructor(){super("bmg","**/*.bmg")}resourceEntries(o){return e(r(o)).map(([r,e])=>({resource:o.slice(o.indexOf("\\")+1,-4),reference:String(r),source:e}))}};