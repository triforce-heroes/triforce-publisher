import {
  RAWDriver as RAW,
  HWACDriver as HWAC,
  TPHDDriver as TPHD,
  ZTFHDriver as ZTFH,
  NLOCDriver as NLOC,
  UDKDriver as UDK,
  Driver as CommandsDriver,
} from "@triforce-heroes/triforce-commands";

import { BMGDriver } from "./BMGDriver.js";
import { Driver } from "./Driver.js";
import { KOEIDriver } from "./KOEIDriver.js";
import { MSBTDriver } from "./MSBTDriver.js";
import { NLOCDriver } from "./NLOCDriver.js";
import { UDKDriver } from "./UDKDriver.js";

export const supportedSourceDrivers = {
  bmg: BMGDriver,
  msbt: MSBTDriver,
  koei: KOEIDriver,
  nloc: NLOCDriver,
  udk: UDKDriver,
};

type SupportedSourceDrivers = keyof typeof supportedSourceDrivers;

export function loadSourceDriver(name: string): Driver | undefined {
  return supportedSourceDrivers[name.toLowerCase() as SupportedSourceDrivers];
}

const enginesDrivers = Object.fromEntries(
  Object.entries({ HWAC, RAW, TPHD, ZTFH, NLOC, UDK }).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]),
);

export function loadEngineDriver(name: string): CommandsDriver | undefined {
  return enginesDrivers[name.toLowerCase()];
}
