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

// Contains typings for HAR json objects. The HAR format spec can be found at
// https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html.
// Note that the spec allows for custom fields to be added. These fields must be
// prefixed by an underscore. Fields mandated by the spec do NOT start with an
// underscore.
// The types below include some custom fields from the chrome-har module:
// https://www.npmjs.com/package/chrome-har.

// NOTE(warrengm): HAR objects may contain fields not included in the types
// below. Optional fields are currently omitted for brevity. Please add new
// fields to the types as needed.

declare module HAR {
  export interface Har {
    log: Log;
  }

  export interface Log {
    version: string;  // HAR version
    creator: Creator;
    entries: Array<Entry>;
  }

  export interface Entry {
    // An identifier for the page.
    pageref?: string;
    // Date and time stamp of the request start
    // (ISO 8601 - YYYY-MM-DDThh:mm:ss.sTZD).
    startedDateTime: string;
    // Total elapsed time of the request in milliseconds. This is the sum of
    // all timings available in the timings object (i.e. not including -1
    // values).
    time: number;
    // Details about the request.
    request: Request;
    // Details about the response.
    response: Response;
    // Network timing.
    timings: Timings;
    // Details about the cache.
    cache: Cache;

    // chrome-har custom fields.

    // The initiator of resource. It will be a string containing a valid JSON
    // object with initiator details. This should be a valid Initiator object
    // according to https://chromedevtools.github.io/devtools-protocol/tot/Network#type-Initiator.
    // TS types for Initiator can be found at https://github.com/ChromeDevTools/devtools-protocol.
    //
    // NOTE(warrengm): The initiator type is included below for convenience.
    // Ideally, the devtools-protocol types would be used instead of our own
    // type, but I had some trouble setting it up.
    _initiator_detail?: string;
  }

  export interface Request {
    // HTTP method. For example, GET or POST.
    method: string;
    // URL of the request.
    url: string;
    // HTTP protocol version (e.g. HTTP/1.1).
    httpVersion: string;
    // Total number of bytes from the start of the HTTP request message until
    // (and including) the double CRLF before the body. Set to -1 if the
    // info is not available.
    headersSize: number;
    // Size of the request body (POST data payload) in bytes. Set to -1 if
    // not applicable.
    bodySize: number;
    // Request body of POST requests.
    postData: object;
  }

  export interface Response {
    // HTTP response status code (e.g. 200).
    status: number;
    // HTTP response status text (e.g. OK).
    statusText: string;
    // HTTP protocol version (e.g. HTTP/1.1).
    httpVersion: string;
    // Total number of bytes from the start of the HTTP response message until
    // (and including) the double CRLF before the body. Set to -1 if the
    // info is not available.
    headersSize: number;
    // Size of the received response body in bytes. Set to zero in case of
    // responses coming from the cache (304). Set to -1 if the info is not
    // available.
    bodySize: number;
  }

  export interface Timings {
    blocked: number;
    dns: number;
    connect: number;
    ssl: number;
    send: number;
    wait: number;
    receive: number;
  }

  // TODO(warrengm): Replace with types from the devtools-protocol module.
  export interface Initiator {
    // Type of this initiator. parser, script, preload, SignedExchange, other
    type: string;
    // Call stack trace. Only set if the initiator type is a script.
    stack?: StackTrace;
    // URL of the initiator. Only set if the initiator type is a script or
    // SignedExchange.
    url?: string;
    // Line number where the initiator sent the request. Only set if the
    // initiator type is a script or parser.
    lineNumber?: number;
  }

  export interface StackTrace {
    description?: string;
    callFrames: Array<CallFrame>;
    parent?: StackTrace;
    parentId?: StackTraceId;
  }

  export interface CallFrame {
    // JavaScript function name.
    functionName: string;
    // Unique identifier for the script.
    scriptId: string;
    // JavaScript script name or URL.
    url: string;
    lineNumber: number;
    columnNumber: number;
  }

  export interface StackTraceId {
    id: string;
    debuggerId?: string;
  }

  export interface Creator {
    name: string;
    version: string;
  }
}
