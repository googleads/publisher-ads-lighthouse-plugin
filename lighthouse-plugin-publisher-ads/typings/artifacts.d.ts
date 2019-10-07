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

declare global {
  export interface Artifacts extends LH.Artifacts {
    IFrameElement: {
      /** The `id` attribute of the iframe. */
      id: string,
      /** The `src` attribute of the iframe. */
      src: string,
      /** The iframe's ClientRect. @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect */
      clientRect: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        width: number;
        height: number;
      },
      /** If the iframe or an ancestor of the iframe is fixed in position. */
      isPositionFixed: boolean,
    };
    StaticAdTags: Array<LH.Crdp.DOM.Node>;
  }
}
