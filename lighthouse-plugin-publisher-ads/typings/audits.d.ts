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

import './lh-externs';

//TODO: make an Audit namespace and NetworkDetails namespace (and change files)
// associated with this change, such as audits.
declare global {
  export namespace NetworkDetails {
    export enum RequestType {
      AD = "ad",
    }
    export interface RequestRecord {
      startTime: number;
      endTime: number;
      duration: number,
      url: string;
      bidder?: string;
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
