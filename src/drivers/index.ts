import {
  TPHDDriver as TPHD,
  ZTFHDriver as ZTFH,
  Driver as CommandsDriver,
} from "@triforce-heroes/triforce-commands";

import { Driver } from "./Driver.js";
import { MSBTDriver } from "./MSBTDriver.js";

export const supportedSourceDrivers = {
  msbt: MSBTDriver,
};

type SupportedSourceDrivers = keyof typeof supportedSourceDrivers;

export function loadSourceDriver(name: string): Driver | undefined {
  return supportedSourceDrivers[name.toLowerCase() as SupportedSourceDrivers];
}

const enginesDrivers = Object.fromEntries(
  Object.entries({ TPHD, ZTFH }).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]),
);

export function loadEngineDriver(name: string): CommandsDriver | undefined {
  return enginesDrivers[name.toLowerCase()];
}
