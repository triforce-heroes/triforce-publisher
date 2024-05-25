import{existsSync as e,readFileSync as t,writeFileSync as r}from"node:fs";import{fatal as n}from"@triforce-heroes/triforce-core/Console";import{secureHash as o}from"@triforce-heroes/triforce-core/Hash";import{supportedLanguages as s,translate as l}from"@triforce-heroes/triforce-core/Translator";import a from"chalk";import i from"p-queue";import{loadEngineDriver as f}from"../drivers/index.js";import{getEntryKey as u}from"../utils/entry.js";import{guessLocale as c,simplifyLocales as p}from"../utils/locale.js";import{printProgress as d}from"../utils/progress.js";function m(r){return e(`./${r}/entries_default.json`)?JSON.parse(t(`./${r}/entries_default.json`,"utf8")):e(`./entries_${r}.json`)?JSON.parse(t(`./entries_${r}.json`,"utf8")):void n(`No entries.json found in ${r}`)}function g(e){return Object.fromEntries([...e.entries()].map(([e,t])=>[p(t).join(","),e]))}class h{constructor(e,t){this.toTranslator=e,this.fromTranslator=t}}class w extends h{constructor(){super(e=>v(e,()=>" ").trim(),e=>e)}}function v(e,t){return e.replaceAll(/<(\d+)>/g,(e,r)=>t(Number(r)))}function j(e,t){return`<${t}>`}let x=[new h(e=>v(e,e=>` <${String(e)}> `),e=>e.replaceAll(/\s*<\s*(\d+)\s*>\s*/g,j)),new h(e=>v(e,e=>` (${String(e)}%) `),e=>e.replaceAll(/\s*\(\s*(\d+)\s*%\s*\)\s*/g,j)),new h(e=>v(e,e=>` <<${String(e)}>> `),e=>e.replaceAll(/\s*<\s*<\s*(\d+)\s*>\s*>\s*/g,j)),new w];function I(e){return[...e.matchAll(/<(\d+)>/g)].map(e=>Number(e[1]))}export async function CompileCommand(p,h,v){let j=f(p);void 0===j&&n(`Unsupported engine driver: ${p}`);let S=h.split(" ");0===S.length&&n("No languages specified"),v?.translate===void 0||s.includes(v.translate)||n(`Invalid source language: ${v.translate}`);let $=new Map;for(let e of S){let t=c(e);void 0===t&&n(`Unsupported language: ${e}`),$.set(e,t)}let N=new Map;for await(let[n,o]of $.entries()){let s=m(n);if(v?.translate===void 0)N.set(o,new Map(s.map(e=>[u(e),[e.source]])));else{let f,c;process.stdout.write(`Translating from ${n}...

`);let p=`./cached-translations.${o}.json`,m=new Map(e(p)?JSON.parse(t(p,"utf8")):[]),g=0,h=setInterval(()=>{f!==c&&(c=f,d(g,s.length,c))},33);function O(){process.stdout.write(a.greenBright("  CACHE SAVED\n\n")),r(p,JSON.stringify([...m.entries()],null,2))}let S=setInterval(O,6e4);d(0,s.length);let $=new i({concurrency:4});for(let e of s)$.add(async()=>{let t=j.parse(e.source),r=t.toCompressed(),n=r.toText(),s=null;if(m.has(n))s=m.get(n);else{let e=I(n);for(let t of x)try{if(s=await l("http://127.0.0.1:5000",o,v.translate,t.toTranslator(n)),null===s)continue;if(e.length>0){if(JSON.stringify(e)!==JSON.stringify(I(s)))continue;s=t instanceof w?n:t.fromTranslator(s)}m.set(n,s)}catch{}}g++,e.translation=r.fromCompressed(s??"",t),e.translationIndex=j.parse(e.translation).toIndex(),f={from:t.toIndex(),to:e.translationIndex}});await $.onIdle(),clearInterval(S),O(),clearInterval(h),d(s.length,s.length),N.set(o,new Map(s.map(e=>[u(e),[e.source,e.translation,e.translationIndex]])))}}process.stdout.write("Preparing publishables... ");let y=[];for await(let e of m(S.at(0)).values()){let t=u(e),r=new Map,n=new Map;for(let e of $.values()){let o=N.get(e);if(void 0===o)continue;let[s,l]=o.get(t);r.has(s)?r.get(s).push(e):r.set(s,[e]),v?.translate!==void 0&&(n.has(l)?n.get(l).push(e):n.set(l,[e]))}let s=N.get(S.at(0))?.get(t)?.[2],l={index:await o(Buffer.from(t)),resource:e.resource,reference:e.reference,...void 0!==e.context&&{context:e.context},sourceIndex:e.sourceIndex,...v?.translate!==void 0&&void 0!==s&&{translationIndex:s},sources:g(r),...v?.translate!==void 0&&{translations:g(n)}};y.push(l)}if(v?.uniques){let e=new Set;for(let t of y)for(let r of Object.values(t.sources))e.add(r);r("./uniques.json",JSON.stringify([...e],null,2))}if(v?.letters){let e=new Set;for(let t of y)for(let r of Object.values(t.sources))for(let t of r)e.add(t);r("./letters.txt",[...e].map(e=>e.codePointAt(0)).sort((e,t)=>e-t).join(","))}r("./publishable.json",JSON.stringify(y,null,2)),process.stdout.write("OK")}