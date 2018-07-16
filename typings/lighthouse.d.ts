/**
 * Type declarations for lighthouse module.
 *
 * NOTE: Only includes the types in use, feel free to add as necessary.
 *
 * TODO: Remove file once https://github.com/GoogleChrome/lighthouse/issues/1773 is closed
 */
declare module 'lighthouse' {
  export = lighthouse;

  function lighthouse(url: string, flags: CoreFlags, config: LH.Config)
    : Promise<LH.RunnerResult | undefined>;

  export interface CoreFlags extends SharedFlagsSettings {
    logLevel?: 'silent' | 'error' | 'info' | 'verbose';
    hostname?: string;
    output?: any;
    port: number;
  }

  namespace lighthouse {
    export class Audit {
      // NOTE: commented as a workaround for our custom artifacts, otherwise
      //   typescript complains that RequiredArtifacts is an unrelated type.
      // static get meta(): LH.Audit.Meta;

      static audit(artifacts: LH.Artifacts, context: LH.Audit.Context)
        : LH.Audit.Product | Promise<LH.Audit.Product>;

      static makeTableDetails(
        headings: LH.Audit.Heading[],
        results: { [x: string]: LH.Audit.DetailsItem }[],
        summary?: LH.Audit.DetailsRendererDetailsSummary
      ): LH.Audit.DetailsRendererDetailsJSON

      static get DEFAULT_PASS(): string;
    }

    export class Gatherer {
      pass(passContext: LH.Gatherer.PassContext): PhaseResult;

      beforePass(passContext: LH.Gatherer.PassContext): PhaseResult;

      afterPass(passContext: LH.Gatherer.PassContext,
        loadData: LH.Gatherer.LoadData): PhaseResult;
    }

    // Alias used inside lighthouse/lighthouse-core/gatherers/gatherer.js
    type PhaseResult = void | LH.GathererArtifacts[keyof LH.GathererArtifacts];
  }
}

declare module 'lighthouse-logger' {
  export function setLevel(level: string): void;
  export function log(title: string, ...args: StringFormat): void;

  interface StringFormat extends Array<string | number> {
    0: string,
  }
}
