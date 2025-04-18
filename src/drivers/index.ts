import {
  RAWDriver as RAW,
  HWACDriver as HWAC,
  TPHDDriver as TPHD,
  ZTFHDriver as ZTFH,
  NLOCDriver as NLOC,
  PKLADriver as PKLA,
  UDKDriver as UDK,
} from "@triforce-heroes/triforce-commands";

import { BMGDriver } from "./BMGDriver.js";
import { KOEIDriver } from "./KOEIDriver.js";
import { LBRSDriver } from "./LBRSDriver.js";
import { MSBTDriver } from "./MSBTDriver.js";
import { NLOCDriver } from "./NLOCDriver.js";
import { PKLADriver } from "./PKLADriver.js";
import { UDKDriver } from "./UDKDriver.js";

import type { Driver } from "./Driver.js";
import type { Driver as CommandsDriver } from "@triforce-heroes/triforce-commands";

type SupportedSourceDrivers = keyof typeof supportedSourceDrivers;

const enginesDrivers = Object.fromEntries(
  Object.entries({ HWAC, RAW, TPHD, ZTFH, NLOC, PKLA, UDK }).map(
    ([key, value]) => [key.toLowerCase(), value],
  ),
);

export const supportedSourceDrivers = {
  bmg: BMGDriver,
  koei: KOEIDriver,
  lbrs: LBRSDriver,
  msbt: MSBTDriver,
  nloc: NLOCDriver,
  pkla: PKLADriver,
  udk: UDKDriver,
};

export function loadSourceDriver(name: string): Driver | undefined {
  return supportedSourceDrivers[name.toLowerCase() as SupportedSourceDrivers];
}

export function loadEngineDriver(name: string): CommandsDriver | undefined {
  return enginesDrivers[name.toLowerCase()];
}
