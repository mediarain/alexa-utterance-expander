var EXAPANSION_POINT_DEF = /^\[([^\]]*)\](.*)$/;
var EXAPANSION_POINT = /\[([^\]]+)\]/;
var fs = require('fs');
var txtBuiltIns = fs.readFileSync(__dirname+'/built-in-expansions.txt','utf8');
var builtInExpansions = parseExpansions(txtBuiltIns)[0];

module.exports = function(input){
  // 0) Tokenize into lines
  // 1) Do a first pass and pull out all of the expansion point definitions
  // 2) A second pass and insert in all of the expansion points
  if(Buffer.isBuffer(input)) input = input.toString('utf8');

  var parsed = parseExpansions(input,builtInExpansions)
    , expansions = parsed[0]
    , extracted = parsed[1]
    , filled = extracted.reduce(function(emit,line){
        var lineAnatomy = parseLineAnatomy(line,expansions);
        emitPermuations(emit,lineAnatomy,lineAnatomy.length-1,'');
        return emit;
      },[])
  ;
  return filled.join('\n');
}

function cloneExpansions(expansions) {
  var clone = {};
  for(let key in expansions) {
    clone[key] = expansions[key].concat([]);
  }
  return clone;
}

function parseExpansions(input, extendExpansions) {
  var expansions = cloneExpansions(extendExpansions || {})
    , lines = input.split(/\r\n|\r|\n/g)
  ;

  var extracted = lines.reduce(function(emit,line){
    var match = line.match(EXAPANSION_POINT_DEF)
    if(!match){ emit.push(line); return emit; }
    var expPoint = match[1]
      , option = match[2].trim();
    expansions[expPoint] = expansions[expPoint] || [];
    expansions[expPoint].push(option);
    return emit;
  },[]);
  return [expansions, extracted];
}

function emitPermuations(emit,lineAnatomy,offset,partial) {
  if(offset < 0)  {
    emit.push(partial.trim());
    return;
  }
  var wiggler = lineAnatomy[offset];
  for(var i =0; i<wiggler.length;++i) {
    emitPermuations(emit,lineAnatomy,offset-1,wiggler[i] + partial);
  }
}

function parseLineAnatomy(line,expansions) {
  var lineAnatomy = []
    , offset = 0
    , match = line.match(EXAPANSION_POINT);
  if(!match){  return [[line]]; }
  while(match) {
    var prior = line.substring(0,match.index);
    if(prior) lineAnatomy.push([prior]);
    var expansion = expansions[match[1]];
    if(!expansion) throw new Error('Cannot find definitions for expansion [' + match[1] +']')
    lineAnatomy.push(expansion);
    line = line.substring(match.index + match[0].length)
    match = line.match(EXAPANSION_POINT);
  }
  if(line) lineAnatomy.push([line]);
  return lineAnatomy;
}

module.exports.parseLineAnatomy = parseLineAnatomy;
module.exports.parseExpansions = parseExpansions;
