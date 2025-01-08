import{existsSync as e,readFileSync as t,writeFileSync as s}from"node:fs";import{Entries as r,EntryText as o}from"@triforce-heroes/triforce-commands";import{fatal as n}from"@triforce-heroes/triforce-core/Console";import{secureHash as l}from"@triforce-heroes/triforce-core/Hash";import i from"chalk";import a from"p-queue";import{loadEngineDriver as f}from"../drivers/index.js";import{getEntryKey as c}from"../utils/entry.js";import{translate as u}from"../utils/google.js";import{guessLocale as d,simplifyLocales as p,weakLocales as g}from"../utils/locale.js";import{printProgress as m}from"../utils/progress.js";import{delay as w}from"../utils/utils.js";function h(s){return e(`./${s}/entries_default.json`)?JSON.parse(t(`./${s}/entries_default.json`,"utf8")):e(`./entries_${s}.json`)?JSON.parse(t(`./entries_${s}.json`,"utf8")):void n(`No entries.json found in ${s}`)}function $(e){return Object.fromEntries([...e.entries()].map(([e,t])=>[p(t).join(","),e]))}class v{constructor(e,t,s){this.name=e,this.toTranslator=t,this.fromTranslator=s}}class S extends v{constructor(){super("drop",e=>x(e,()=>" ").trim(),e=>e)}}function x(e,t){return e.replaceAll(/<(\d+)>/g,(e,s)=>t(Number(s)))}function j(e,t){return`<${t}>`}let A=[new v("default",e=>x(e,e=>` <${String(e)}> `),e=>e.replaceAll(/\s*<\s*(\d+)\s*>\s*/g,j)),new v("hashtag",e=>x(e,e=>` #${String(e)} `),e=>e.replaceAll(/\s*(?:#|n\s*º)\s*(\d+)\s*/g,j)),new v("percent",e=>x(e,e=>` (${String(e)}%) `),e=>e.replaceAll(/\s*\(\s*(\d+)\s*%\s*\)\s*/g,j)),new v("brackets",e=>x(e,e=>` [${String(e)}] `),e=>e.replaceAll(/\s*\[\s*(\d+)\s*\]\s*/g,j)),new v("double arrows",e=>x(e,e=>` <<${String(e)}>> `),e=>e.replaceAll(/\s*<\s*<\s*(\d+)\s*>\s*>\s*/g,j)),new v("quotes",e=>x(e,e=>` ("${String(e)}") `),e=>e.replaceAll(/\s*\(\s*"\s*(\d+)\s*"\s*\)\s*/g,j)),new v("hr id",e=>x(e,e=>` <hr id="${String(e)}" /> `),e=>e.replaceAll(/\s*<hr\s*id\s*=\s*"\s*(\d+)\s*"\s*\/\s*>\s*/g,j)),new v("ears",e=>x(e,e=>` )<${String(e)}>( `),e=>e.replaceAll(/\s*\)\s*<\s*(\d+)\s*>\s*\(\s*/g,j)),new v("eyes",e=>x(e,e=>` (.)<${String(e)}>(.) `),e=>e.replaceAll(/\s*\(\s*\.\s*\)\s*<\s*(\d+)\s*>\s*\(\s*\.\s*\)\s*/g,j)),new v("breaks",e=>x(e,e=>`\r
<${String(e)}>\r
`),e=>e.replaceAll(/\s*<\s*(\d+)\s*>\s*/g,j)),new S];function I(e){return[...e.matchAll(/<(\d+)>/g)].map(e=>Number(e[1]))}let b=[[", or "," or "],[", and "," and "]];export async function CompileCommand(p,v,x){let j=f(p);void 0===j&&n(`Unsupported engine driver: ${p}`);let y=v.split(" ");if(0===y.length&&n("No languages specified"),x?.translate!==void 0)for(let e of y)void 0===d(e)&&n(`Invalid source language: ${x.translate}`);let N=new Map;for(let e of y){let t=d(e);void 0===t&&n(`Unsupported language: ${e}`),N.set(e,t)}let C=new Map;for await(let[l,f]of N.entries()){let d=h(l);if(x?.translate===void 0)C.set(f,new Map(d.map(e=>[c(e),[e.source]])));else{let p,h;process.stdout.write(`Translating from ${l} as ${f}...

`);let $=`./cached-translations.${f}.json`,v=new Map(e($)?JSON.parse(t($,"utf8")):[]),y=0,N=setInterval(()=>{p!==h&&(h=p,m(y,d.length,h))},1e3);function O(){process.stdout.write(i.greenBright("  CACHE SAVED\n\n")),s($,JSON.stringify([...v.entries()],null,2))}let T=setInterval(O,6e4);m(0,d.length);let k=new a({concurrency:x.concurrences});for(let e of d)k.add(async()=>{let t=new r(j.parse(e.source).entries.map(e=>{if(e instanceof o){let{text:t}=e;for(let[e,s]of b)t=t.replaceAll(e,s);return new o(t)}return e})),s=t.toCompressed(),l=s.toCompressed(),i=l.toText(),a=null;if(v.has(i))a=v.get(i);else{let e=I(i);e:for(let t=0;t<3;t++)for(let s of A){if(a=null,s instanceof S)break e;try{a=await u(f,x.translate,s.toTranslator(i),x.cookieId)}catch(e){"Too Many Requests"===e.message&&n("Too many requests: requires --cookie-id"),await w(1e3*t);continue e}if(e.length>0&&JSON.stringify(e)!==JSON.stringify(I(s.fromTranslator(a)))){if(g.includes(f)){a=null;break e}continue}if(!(a=s.fromTranslator(a)).includes("><")){v.set(i,a);break e}}}y++,e.translation=s.fromCompressed(l.fromCompressed(a??"",s),t),e.translationIndex=j.parse(e.translation).toIndex(),p={from:t.toIndex(),to:e.translationIndex}});await k.onIdle(),clearInterval(T),O(),clearInterval(N),m(d.length,d.length),C.set(l,new Map(d.map(e=>[c(e),[e.source,e.translation,e.translationIndex]])))}}process.stdout.write("Preparing publishables... ");let T=[],k=h(y.at(0)),J=new Set;for await(let e of k.values()){let t=c(e),s=new Map,r=new Map;for(let[e,o]of N.entries()){let n=C.get(e);if(void 0===n)continue;let[l,i]=n.get(t);if(s.has(l))s.get(l).push(e);else if(s.set(l,[e]),x?.letters&&!g.includes(o))for(let e of j.parse(l).toCompressed().toText())J.add(e.codePointAt(0));if(x?.translate!==void 0){if(r.has(i))r.get(i).push(e);else if(r.set(i,[e]),x.letters)for(let e of j.parse(i).toCompressed().toText())J.add(e.codePointAt(0))}}let o=C.get(y.at(0))?.get(t)?.[2],n={index:await l(Buffer.from(t)),resource:e.resource,reference:e.reference,...void 0!==e.context&&{context:e.context},sourceIndex:e.sourceIndex,...x?.translate!==void 0&&void 0!==o&&{translationIndex:o},sources:$(s),...x?.translate!==void 0&&{translations:$(r)}};T.push(n)}if(x?.uniques){let e=new Set;for(let t of T)for(let s of Object.values(t.sources))e.add(s);s("./uniques.json",JSON.stringify([...e],null,2))}x?.letters&&s("./letters.txt",[...J].sort((e,t)=>e-t).join(",")),s("./publishable.json",JSON.stringify(T,null,2)),process.stdout.write("OK")}