// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
      ): LH.Audit.DetailsRendererDetailsJSON;

      static get DEFAULT_PASS(): string;

      static computeLogNormalScore(
        controlPoints : {median: number, p10: number},
        value: number,
      ): number;
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
  export function warn(title: string, ...args: StringFormat): void;
  export function error(title: string, ...args: StringFormat): void;

  interface StringFormat extends Array<string | number> {
    0: string,
  }
}

declare module 'lighthouse/lighthouse-core/computed/network-records.js' {
  export function request(devToolsLog: LH.DevtoolsLog, context: LH.Audit.Context): Promise<Array<LH.Artifacts.NetworkRequest>>;
}

declare module 'lighthouse/lighthouse-core/computed/page-dependency-graph.js' {
  export function getNetworkInitiators(record: LH.Artifacts.NetworkRequest): Array<string>;
}

declare module 'lighthouse/lighthouse-core/computed/main-thread-tasks.js' {
  export function request(trace: LH.Trace, context: LH.Audit.Context): Promise<Array<TaskNode>>;
}

declare module 'lighthouse/lighthouse-core/lib/i18n/i18n.js'; {
  export function createMessageInstanceIdFn(filename: string, fileStrings: Record<string, string>);
}
