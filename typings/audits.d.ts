import './lh-externs';

//TODO: make an Audit namespace and NetworkDetails namespace (and change files)
// associated with this change, such as audits.
declare global {
  export interface AuditMetadata extends LH.Audit.Meta {
    requiredArtifacts: Array<keyof Artifacts>
  }

  export namespace NetworkDetails {
    export enum RequestType {
      AD = "ad",
    }
    export interface RequestRecord {
      startTime: number;
      endTime: number;
      url: string;
      type: string;
      abbreviatedUrl?: string;
    }
  }
  export namespace RequestTree {
    export interface TreeNode {
      name: string;
      children: Array<TreeNode>;
    }
  }
}