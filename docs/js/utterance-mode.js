CodeMirror.defineSimpleMode("utterance-mode", {
  // The start state contains the rules that are initially used
  start: [
    {regex: /\[[^\]]+\]/, token: "string"},
    {regex: /\{[^\}]+\}/, token: "number"},
    {regex: /\/\/.*/, token: "comment"},
  ]
});
