import{normalize as r}from"@triforce-heroes/triforce-core/Path";import{glob as t}from"glob";import{minimatch as e}from"minimatch";export class Driver{constructor(r,t){this.name=r,this.pattern=t}async entries(o,s){return(await t(o)).filter(r=>e(r,this.pattern,{matchBase:!0})).map(t=>r(t)).sort().flatMap(r=>this.resourceEntries(r)).map(r=>({...r,sourceIndex:s.parse(r.source).toIndex()}))}}