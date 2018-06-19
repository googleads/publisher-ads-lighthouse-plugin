declare module 'lighthouse' {
  interface Lighthouse {
    (url: string, flags: LH.Flags, config: LH.Config): void;
  }
  export = Lighthouse;
}
