import{TPHDDriver as r,ZTFHDriver as e}from"@triforce-heroes/triforce-commands";import{MSBTDriver as o}from"./MSBTDriver.js";export const supportedSourceDrivers={msbt:o};export function loadSourceDriver(r){return supportedSourceDrivers[r.toLowerCase()]}let t=Object.fromEntries(Object.entries({TPHD:r,ZTFH:e}).map(([r,e])=>[r.toLowerCase(),e]));export function loadEngineDriver(r){return t[r.toLowerCase()]}