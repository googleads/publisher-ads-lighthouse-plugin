import './lh-externs';

declare global {
  export interface AuditMetadata extends LH.Audit.Meta {
    requiredArtifacts: Array<keyof Artifacts>
  }
}
