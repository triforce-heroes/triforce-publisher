import{readFileSync as r}from"node:fs";import{normalize as t}from"@triforce-heroes/triforce-core/Path";import{glob as e}from"glob";import{minimatch as o}from"minimatch";export class Driver{constructor(r,t){this.name=r,this.pattern=t}validate(r){return!0}async entries(a,i){return(await e(t(a))).filter(r=>o(r,this.pattern,{matchBase:!0})).map(t=>{let e=r(t);return this.validate(e)?{path:t,resource:e}:void 0}).filter(r=>void 0!==r).sort().flatMap(r=>this.resourceEntries(r.path,r.resource)).map(r=>({...r,sourceIndex:i.parse(r.source).toIndex()}))}reassignLocales(r){return{default:r}}}