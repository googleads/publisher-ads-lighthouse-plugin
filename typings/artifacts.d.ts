import './lh-externs';

declare global {
  export interface Artifacts extends LH.Artifacts {
    RenderedAdSlots: Array<LH.Crdp.DOM.BoxModel | null>;
    StaticAdTags: Array<LH.Crdp.DOM.Node>;
    Network: NetworkArtifacts;
  }

  export interface NetworkArtifacts {
    har: HAR.Har;
    networkEvents: Array<LH.Protocol.RawEventMessage>;
    parsedUrls: Array<URL>;
  }
}
