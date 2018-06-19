declare module 'chrome-har' {
  import protocol = require('lighthouse/typings/protocol');
  function harFromMessages(messages: Array<LH.Protocol.RawEventMessage>): HAR.Har;
}
