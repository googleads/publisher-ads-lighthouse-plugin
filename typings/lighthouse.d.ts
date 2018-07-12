declare module 'lighthouse' {
  interface Lighthouse {
    (url: string, flags: LH.Flags, config: LH.Config): Promise<LH.RunnerResult>;
  }
  export = Lighthouse;
}

declare module 'lighthouse-logger' {
  export function setLevel(level: string): void;
  export function log(title: string, ...args: StringFormat): void;

  interface StringFormat extends Array<string | number> {
    0: string
  }
}
