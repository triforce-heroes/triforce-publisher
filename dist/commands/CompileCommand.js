import{existsSync as e,readFileSync as t,writeFileSync as r}from"node:fs";import{fatal as s}from"@triforce-heroes/triforce-core/Console";import{secureHash as o}from"@triforce-heroes/triforce-core/Hash";import n from"chalk";import l from"p-queue";import{loadEngineDriver as i}from"../drivers/index.js";import{getEntryKey as a}from"../utils/entry.js";import{translate as f}from"../utils/google.js";import{guessLocale as u,simplifyLocales as c,weakLocales as d}from"../utils/locale.js";import{printProgress as p}from"../utils/progress.js";import{delay as g}from"../utils/utils.js";function m(r){return e(`./${r}/entries_default.json`)?JSON.parse(t(`./${r}/entries_default.json`,"utf8")):e(`./entries_${r}.json`)?JSON.parse(t(`./entries_${r}.json`,"utf8")):void s(`No entries.json found in ${r}`)}function h(e){return Object.fromEntries([...e.entries()].map(([e,t])=>[c(t).join(","),e]))}class w{constructor(e,t,r){this.name=e,this.toTranslator=t,this.fromTranslator=r}}class v extends w{constructor(){super("drop",e=>x(e,()=>" ").trim(),e=>e)}}function x(e,t){return e.replaceAll(/<(\d+)>/g,(e,r)=>t(Number(r)))}function j(e,t){return`<${t}>`}let $=[new w("default",e=>x(e,e=>` <${String(e)}> `),e=>e.replaceAll(/\s*<\s*(\d+)\s*>\s*/g,j)),new w("hashtag",e=>x(e,e=>` #${String(e)} `),e=>e.replaceAll(/\s*(?:#|n\s*º)\s*(\d+)\s*/g,j)),new w("percent",e=>x(e,e=>` (${String(e)}%) `),e=>e.replaceAll(/\s*\(\s*(\d+)\s*%\s*\)\s*/g,j)),new w("brackets",e=>x(e,e=>` [${String(e)}] `),e=>e.replaceAll(/\s*\[\s*(\d+)\s*\]\s*/g,j)),new w("double arrows",e=>x(e,e=>` <<${String(e)}>> `),e=>e.replaceAll(/\s*<\s*<\s*(\d+)\s*>\s*>\s*/g,j)),new w("hr id",e=>x(e,e=>` <hr id="${String(e)}" /> `),e=>e.replaceAll(/\s*<hr\s*id\s*=\s*"\s*(\d+)\s*"\s*\/\s*>\s*/g,j)),new v];function S(e){return[...e.matchAll(/<(\d+)>/g)].map(e=>Number(e[1]))}export async function CompileCommand(c,w,x){let j=i(c);void 0===j&&s(`Unsupported engine driver: ${c}`);let I=w.split(" ");if(0===I.length&&s("No languages specified"),x?.translate!==void 0)for(let e of I)void 0===u(e)&&s(`Invalid source language: ${x.translate}`);let b=new Map;for(let e of I){let t=u(e);void 0===t&&s(`Unsupported language: ${e}`),b.set(e,t)}let A=new Map;for await(let[s,o]of b.entries()){let i=m(s);if(x?.translate===void 0)A.set(o,new Map(i.map(e=>[a(e),[e.source]])));else{let u,c;process.stdout.write(`Translating from ${s} as ${o}...

`);let m=`./cached-translations.${o}.json`,h=new Map(e(m)?JSON.parse(t(m,"utf8")):[]),w=0,I=setInterval(()=>{u!==c&&(c=u,p(w,i.length,c))},1e3);function N(){process.stdout.write(n.greenBright("  CACHE SAVED\n\n")),r(m,JSON.stringify([...h.entries()],null,2))}let b=setInterval(N,6e4);p(0,i.length);let O=new l({concurrency:x.concurrences});for(let e of i)O.add(async()=>{let t=j.parse(e.source),r=t.toCompressed(),s=r.toText(),n=null;if(h.has(s))n=h.get(s);else{let e=S(s);e:for(let t=0;t<3;t++)for(let r of $){if(n=null,r instanceof v)break e;try{n=await f(o,x.translate,r.toTranslator(s),x.cookieId)}catch{await g(1e3*t);continue e}if(e.length>0&&JSON.stringify(e)!==JSON.stringify(S(r.fromTranslator(n)))){if(d.includes(o)){n=null;break e}continue}n=r.fromTranslator(n),h.set(s,n);break e}}w++,e.translation=r.fromCompressed(n??"",t),e.translationIndex=j.parse(e.translation).toIndex(),u={from:t.toIndex(),to:e.translationIndex}});await O.onIdle(),clearInterval(b),N(),clearInterval(I),p(i.length,i.length),A.set(s,new Map(i.map(e=>[a(e),[e.source,e.translation,e.translationIndex]])))}}process.stdout.write("Preparing publishables... ");let O=[],y=m(I.at(0)),C=new Set;for await(let e of y.values()){let t=a(e),r=new Map,s=new Map;for(let[e,o]of b.entries()){let n=A.get(e);if(void 0===n)continue;let[l,i]=n.get(t);if(r.has(l))r.get(l).push(e);else if(r.set(l,[e]),x?.letters&&!d.includes(o))for(let e of j.parse(l).toCompressed().toText())C.add(e.codePointAt(0));if(x?.translate!==void 0){if(s.has(i))s.get(i).push(e);else if(s.set(i,[e]),x.letters)for(let e of j.parse(i).toCompressed().toText())C.add(e.codePointAt(0))}}let n=A.get(I.at(0))?.get(t)?.[2],l={index:await o(Buffer.from(t)),resource:e.resource,reference:e.reference,...void 0!==e.context&&{context:e.context},sourceIndex:e.sourceIndex,...x?.translate!==void 0&&void 0!==n&&{translationIndex:n},sources:h(r),...x?.translate!==void 0&&{translations:h(s)}};O.push(l)}if(x?.uniques){let e=new Set;for(let t of O)for(let r of Object.values(t.sources))e.add(r);r("./uniques.json",JSON.stringify([...e],null,2))}x?.letters&&r("./letters.txt",[...C].sort((e,t)=>e-t).join(",")),r("./publishable.json",JSON.stringify(O,null,2)),process.stdout.write("OK")}