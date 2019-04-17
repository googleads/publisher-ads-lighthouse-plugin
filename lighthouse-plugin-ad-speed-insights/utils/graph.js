// Copyright 2019 Google LLC
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

// @ts-ignore
// eslint-disable-next-line
const BaseNode = require('lighthouse/lighthouse-core/lib/dependency-graph/base-node');

/** @typedef {LH.TraceEvent} TraceEvent */
/** @typedef {LH.Artifacts.NetworkRequest} NetworkRequest */

/**
 * Returns all requests and CPU tasks in the loading graph of the target
 * requests.
 * @param {typeof BaseNode} root The root node of the DAG.
 * @param {(req: NetworkRequest) => boolean} isTargetRequest
 * @return {{requests: NetworkRequest[], traceEvents: TraceEvent[]}}
 */
function getTransitiveClosure(root, isTargetRequest) {
  const visited = new Set();
  const closure = new Set();
  const stack = root.getDependents();
  /** @type {LH.Artifacts.NetworkRequest} */
  let firstTarget = null;
  while (stack.length) {
    const node = stack.pop();

    const isTarget = node.record && isTargetRequest(node.record);
    if (isTarget || closure.has(node)) {
      for (const n of stack) {
        closure.add(n);
      }
      if (isTarget) {
        firstTarget =
            !firstTarget || node.record.startTime < firstTarget.startTime ?
              node.record : firstTarget;
      }
    }

    if (!visited.has(node)) {
      visited.add(node);
      stack.push(...node.getDependents());
    }
  }

  const requests = Array.from(closure).map((n) => n.record)
      .filter(Boolean).filter((r) => r.endTime < firstTarget.startTime);
  const cpu = Array.from(closure).filter((n) => n.event)
      .filter((n) => n.event.ts < firstTarget.startTime * 1000 * 1000)
      .map((n) => [n.event, ...n.childEvents]);

  const  traceEvents = [].concat.apply([], cpu);  // eslint-disable-line
  return {requests, traceEvents};
}

module.exports = {getTransitiveClosure};
