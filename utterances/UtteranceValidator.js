var _ = require('lodash')
  , fs = require('fs')
  , path = require('path')
;

module.exports = function(input){
  var lines = input.split(/\r\n|\r|\n/g)
    , duplicates;

  return lines.reduce(function(errors,line,i){
    if(!line) return errors;
    var lineNumber = i+1;
    var parsed = parseLine(line);
    // Lines must have an utterance
    if(!parsed.utterance.trim()) {
      errors.push({message: 'No utterance for ' + parses.intent + ' on line ' + lineNumber,line: lineNumber});
      return errors;
    }
    // Lines must not be duplicates
  },[]);
}


function parseLine(line) {
  var iSpace = line.indexOf(' ');
  return {
    intent: line.substring(0,i),
    utterance: line.substring(i+1)
  };
}
