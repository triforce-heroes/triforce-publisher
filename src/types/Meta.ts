type ProfileSequential = [
  "S",
  initialOffset: number,
  copyRules: Record<string, string>,
];

type ProfileBlock = [
  "B",
  initialOffset: number,
  finalOffset: number,
  step: number,
];

export interface Meta {
  locales: string[];
  profiles: Array<ProfileBlock | ProfileSequential>;
}
