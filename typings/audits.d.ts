declare module NetworkDetails {
  export enum RequestType {
    AD = "ad",
    UNKNOWN = "unknown",
  }
  export interface RequestRecord {
    startTime: number;
    endTime: number;
    url: string;
  }
  export interface ShallowRecord {
    startTime: number;
    endTime: number;
    url: string;
    type: string;
  }
}