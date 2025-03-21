import{existsSync as e,readFileSync as t,writeFileSync as r}from"node:fs";import{Entries as o,EntryText as s}from"@triforce-heroes/triforce-commands";import{fatal as n}from"@triforce-heroes/triforce-core/Console";import{secureHash as i}from"@triforce-heroes/triforce-core/Hash";import a from"chalk";import l from"p-queue";import{loadEngineDriver as f}from"../drivers/index.js";import{commandDrivers as u,DropCommandDriver as c}from"../types/CommandDriver.js";import{getEntryKey as d}from"../utils/entry.js";import{translate as m}from"../utils/google.js";import{guessLocale as p,simplifyLocales as g,weakLocales as h}from"../utils/locale.js";import{printProgress as v}from"../utils/progress.js";import{delay as j}from"../utils/utils.js";function w(r){return e(`./${r}/entries_default.json`)?JSON.parse(t(`./${r}/entries_default.json`,"utf8")):e(`./entries_${r}.json`)?JSON.parse(t(`./entries_${r}.json`,"utf8")):void n(`No entries.json found in ${r}`)}function x(e){return[...e.matchAll(/<(?<command>\d+)>/g)].map(e=>Number(e.groups.command))}let I=[[", or "," or "],[", and "," and "]];export async function CompileCommand(y,C,O){let b=f(y);void 0===b&&n(`Unsupported engine driver: ${y}`);let N=C.split(" ");if(0===N.length&&n("No languages specified"),O?.translate!==void 0)for(let e of N)void 0===p(e)&&n(`Invalid source language: ${O.translate}`);let S=new Map;for(let e of N){let t=p(e);void 0===t&&n(`Unsupported language: ${e}`),S.set(e,t)}let $=new Map;for(let[i,f]of S.entries()){let p=w(i);if(O?.translate===void 0)$.set(i,new Map(p.map(e=>[d(e),[e.source]])));else{let g,w;process.stdout.write(`Translating from ${i} as ${f}...

`);let y=`./cached-translations.${f}.json`,C=new Map(e(y)?JSON.parse(t(y,"utf8")):[]),N=0,S=setInterval(()=>{g!==w&&(w=g,v(N,p.length,w))},1e3);function T(){process.stdout.write(a.greenBright("  CACHE SAVED\n\n")),r(y,JSON.stringify([...C.entries()],null,2))}let J=setInterval(T,6e4);v(0,p.length);let M=new l({concurrency:O.concurrences});for(let e of p)M.add(async()=>{let t=new o(b.parse(e.source).entries.map(e=>{if(e instanceof s){let{text:t}=e;for(let[e,r]of I)t=t.replaceAll(e,r);return new s(t)}return e})),r=t.toCompressed(),i=r.toCompressed(),a=i.toText(),l=null;if(C.has(a))l=C.get(a);else{let e=x(a);e:for(let t=0;t<3;t++)for(let r of u){if(l=null,r instanceof c)break e;try{l=await m(f,O.translate,r.toTranslator(a),O.cookieId)}catch(e){"Too Many Requests"===e.message&&n("Too many requests: requires --cookie-id"),await j(1e3*t);continue e}if(e.length>0&&JSON.stringify(e)!==JSON.stringify(x(r.fromTranslator(l)))){if(h.includes(f)){l=null;break e}continue}if(!(l=r.fromTranslator(l)).includes("><")){C.set(a,l);break e}}}N++,e.translation=r.fromCompressed(i.fromCompressed(l??"",r),t),e.translationIndex=b.parse(e.translation).toIndex(),g={from:t.toIndex(),to:e.translationIndex}});await M.onIdle(),clearInterval(J),T(),clearInterval(S),v(p.length,p.length),$.set(i,new Map(p.map(e=>[d(e),[e.source,e.translation,e.translationIndex]])))}}process.stdout.write("Preparing publishables... ");let J=[],M=w(N.at(0)),k=new Set;for(let e of M.values()){let t=d(e),r=new Map,o=new Map;for(let[e,s]of S.entries()){let n=$.get(e);if(n?.has(t)!==!0)continue;let[i,a]=n.get(t);if(r.has(i))r.get(i).push(e);else if(r.set(i,[e]),O?.letters===!0&&!h.includes(s))for(let e of b.parse(i).toCompressed().toText())k.add(e.codePointAt(0));if(O?.translate!==void 0){if(o.has(a))o.get(a).push(e);else if(o.set(a,[e]),!0===O.letters)for(let e of b.parse(a).toCompressed().toText())k.add(e.codePointAt(0))}}let s=$.get(N.at(0))?.get(t)?.[2],n={index:await i(Buffer.from(t)),resource:e.resource,reference:e.reference,...void 0!==e.context&&{context:e.context},sourceIndex:e.sourceIndex,...O?.translate!==void 0&&void 0!==s&&{translationIndex:s},sources:Object.fromEntries(r.entries()),...O?.translate!==void 0&&{translations:Object.fromEntries([...o.entries()].map(([e,t])=>[g(t).join(","),e]))}};J.push(n)}if(O?.uniques===!0){let e=new Set;for(let t of J)for(let r of Object.values(t.sources))e.add(r);r("./uniques.json",JSON.stringify([...e],null,2))}O?.letters===!0&&r("./letters.txt",[...k].sort((e,t)=>e-t).join(",")),r("./publishable.json",JSON.stringify(J,null,2)),process.stdout.write("OK")}