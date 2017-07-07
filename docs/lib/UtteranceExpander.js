(function(){

var EXAPANSION_POINT_DEF = /^\[([^\]]*)\](.*)$/;
var EXAPANSION_POINT = /\[([^\]]+)\]/;
var txtbuildInUtterances = getBuiltIns();
var builtInExpansions = parseExpansions(txtbuildInUtterances)[0];
//var builtInExpansions = {}

if(typeof require === 'function') {
  module.exports = UtteranceExpander;
}
else {
  window.UtteranceExpander = UtteranceExpander;
}

UtteranceExpander.parseLineAnatomy = parseLineAnatomy;
UtteranceExpander.parseExpansions = parseExpansions;

function UtteranceExpander(input){
  // 0) Tokenize into lines
  // 1) Do a first pass and pull out all of the expansion point definitions
  // 2) A second pass and insert in all of the expansion points
  if(typeof Buffer != 'undefined' && Buffer.isBuffer(input)) input = input.toString('utf8');

  var [expansions, extracted ] = parseExpansions(input,builtInExpansions)
  var filled = extracted.reduce(function(emit,line){
        emitLinePermuations(emit,line.txt,expansions,line.lineNum);
        return emit;
      },[])
  ;
  return filled.join('\n');
}

/// Clones an expansion object since it could be mutated when extending
function cloneExpansions(expansions) {
  var clone = {};
  for(let key in expansions) {
    clone[key] = expansions[key].concat([]);
  }
  return clone;
}

// When parsing expansions, we should continue to do it over and over again until we get it to settle.
// That is, until all of the expansion definitions do not have other expansions in them

/// Parses a text stream into an expansions object. This is pass one of a two pass parser.
/// This pass pulls out what the value of all of the expansion options are. return [0]
/// Also pulls out all of the lines that are not expansion divisions for later parsing return[1]
function parseExpansions(input, extendExpansions) {
  var expansions = cloneExpansions(extendExpansions || {})
    , lines = input.split(/\r\n|\r|\n/g)
  ;

  var extracted = lines.reduce(function(emit,line,i){
    line = line.replace(/\/\/.*/,'');
    var match = line.match(EXAPANSION_POINT_DEF)
    if(!match){ emit.push({txt: line, lineNum: i+1}); return emit; }
    var expPoint = match[1]
      , option = match[2].trim();
    expansions[expPoint] = expansions[expPoint] || [];
    expansions[expPoint].push({txt: option, lineNum: i+1});
    return emit;
  },[]);

  expansions = recursivelySettleExpansions(expansions,0)
  return [expansions, extracted];
}

function recursivelySettleExpansions(expansions,depth) {
  if(depth > 10) throw new Error(`Expansions may not reference themselves more than 100 times. That's just too deep man.`);
  var foundExpansion = false;
  let nextExpansions = {}
  for(let expKey in expansions) {
    var perms = [];
    for(let {txt, lineNum } of expansions[expKey]) {
      let outPerms = [];
      emitLinePermuations(outPerms,txt,expansions,lineNum);
      outPerms.forEach(x => perms.push({txt: x, lineNum}));
    }
      /*
      //foundExpansions = foundExpansion || (expandCount > 0);
      console.log(`Key: ${expKey} Clause: ${clause} Expand Cnt: ${expandCount} | ${foundExpansions}`)
      */
    nextExpansions[expKey] = perms;
    var foundExpansion = foundExpansion || JSON.stringify(expansions[expKey]) != JSON.stringify(perms); // An easy way to do deem compare. Did anything change?
  }
  //console.log(`Converted ${expansions} to ${nextExpansions} and needsMore? ${foundExpansion}`)
  if(foundExpansion) return recursivelySettleExpansions(nextExpansions,depth+1);
  return nextExpansions;
}

function emitLinePermuations(emit, line, expansions, lineNum) {
  let lineAnatomy = parseLineAnatomy(line,expansions, lineNum);
  emitPermuations(emit ,lineAnatomy,lineAnatomy.length-1,'');
  return lineAnatomy.length;
}

function emitPermuations(emit,lineAnatomy,offset,partial) {
  if(offset < 0)  {
    emit.push(partial.trim().replace(/ +/g,' '));
    return;
  }
  var wiggler = lineAnatomy[offset];
  for(var i =0; i<wiggler.length;++i) {
    emitPermuations(emit,lineAnatomy,offset-1,wiggler[i] + partial);
  }
}

// parses a line with some expansions into an array of things that should combinate.
// LaunchIntent blah [blah] foo [blah] bat => [['LaunchIntent blah '],[1,2,3],[' foo '],[1,2,3],[' bat']]
function parseLineAnatomy(line,expansions,lineNum) {
  var lineAnatomy = []
    , offset = 0
    , match = line.match(EXAPANSION_POINT)
  ;
  if(!match){  return [[line]]; }
  while(match) {
    var prior = line.substring(0,match.index);
    if(prior) lineAnatomy.push([prior]);
    var expansion = expansions[match[1]];
    if(!expansion) throw new Error(`No definitions for [${match[1]}] on line ${lineNum}`)
    lineAnatomy.push(expansion.map(x => x.txt));
    line = line.substring(match.index + match[0].length)
    match = line.match(EXAPANSION_POINT);
  }
  if(line) lineAnatomy.push([line]);
  return lineAnatomy;
}


function getBuiltIns() {
  return `
[PLEASE] please
[PLEASE]

[YES] absolutely
[YES] affirmative
[YES] all right
[YES] all righty
[YES] amen
[YES] aye aye
[YES] bring it
[YES] bring it on
[YES] by all means
[YES] check
[YES] cool
[YES] definitely
[YES] do it
[YES] exactly
[YES] fine
[YES] for real
[YES] for sure
[YES] gladly
[YES] go for it
[YES] good
[YES] hell ya
[YES] hell yea
[YES] hells yes
[YES] i sure am
[YES] naturally
[YES] of course
[YES] oh yeah
[YES] okay
[YES] please
[YES] positively
[YES] right on
[YES] roger
[YES] sure
[YES] sure sounds good
[YES] sure thing
[YES] thanks
[YES] uh huh
[YES] very well
[YES] yea
[YES] yeah
[YES] yep
[YES] yeppers
[YES] yes
[YES] yes confirm
[YES] yes confirm that
[YES] yes i accept
[YES] yes i confirm
[YES] yes I'd like that
[YES] yes please
[YES] yes way
[YES] yes you can
[YES] yes you may
[YES] yessum
[YES] you bet
[YES] you know it
[YES] yup

[NO] absolutely not
[NO] afraid not
[NO] by no means
[NO] don't
[NO] don't do that
[NO] hell no
[NO] i don't think so
[NO] i don't want that
[NO] i'd better not
[NO] i'm afraid not
[NO] maybe another time
[NO] nah
[NO] negative
[NO] negatory
[NO] negatron
[NO] never
[NO] nix
[NO] no
[NO] no don't remove it
[NO] no don't remove it please
[NO] no keep it
[NO] no keep it please
[NO] no let's keep it
[NO] no let's keep it please
[NO] no thank you
[NO] no thanks
[NO] no way
[NO] nope
[NO] not at all
[NO] not by any means
[NO] not ever
[NO] not now
[NO] not right now
[NO] not this time
[NO] thanks but no thanks
[NO] that's a bad idea
[NO] unfortunately not

[NEXT] continue
[NEXT] continue please
[NEXT] continue the list
[NEXT] continue the list please
[NEXT] continue with list
[NEXT] continue with list please
[NEXT] continue with the list
[NEXT] continue with the list please
[NEXT] don't stop
[NEXT] go forward
[NEXT] go forward now
[NEXT] go forward now please
[NEXT] go forward please
[NEXT] jump ahead
[NEXT] jump ahead please
[NEXT] jump forward
[NEXT] jump forward please
[NEXT] keep going
[NEXT] keep going please
[NEXT] move forward please
[NEXT] move on
[NEXT] move on please
[NEXT] next
[NEXT] next please
[NEXT] skip
[NEXT] skip please
[NEXT] skip that one
[NEXT] skip that one please
[NEXT] the one after
[NEXT] the one after please
[NEXT] the next one
[NEXT] the next one please
[NEXT] what's next

[REPEAT] again
[REPEAT] again please
[REPEAT] can you repeat that
[REPEAT] can you repeat that please
[REPEAT] couldn't hear you
[REPEAT] i couldn't hear you
[REPEAT] i didn't catch that
[REPEAT] i'm not sure what you said
[REPEAT] once again
[REPEAT] once again please
[REPEAT] once more
[REPEAT] once more please
[REPEAT] one more time
[REPEAT] one more time please
[REPEAT] play it again
[REPEAT] play it again please
[REPEAT] please repeat
[REPEAT] please repeat that
[REPEAT] please repeat what you said
[REPEAT] repeat
[REPEAT] repeat it
[REPEAT] repeat it please
[REPEAT] repeat please
[REPEAT] say it again
[REPEAT] say it again please
[REPEAT] say that again
[REPEAT] say that again please
[REPEAT] tell me again
[REPEAT] tell me again please
[REPEAT] tell me once more
[REPEAT] tell me once more please
[REPEAT] try it again
[REPEAT] try it again please
[REPEAT] wait
[REPEAT] wait what
[REPEAT] what
[REPEAT] what did you say
[REPEAT] what was that
[REPEAT] what's that

[STOP] all done
[STOP] close
[STOP] complete
[STOP] done
[STOP] end
[STOP] end please
[STOP] exit
[STOP] exit please
[STOP] finished
[STOP] goodbye
[STOP] i am done
[STOP] i'm done
[STOP] no more
[STOP] no more please
[STOP] please close
[STOP] please end
[STOP] please stop
[STOP] stop
[STOP] stop please
[STOP] that's all
[STOP] that's it
[STOP] the end
[STOP] we're done
[STOP] we're done here
[STOP] good night
[STOP] neither

[CANCEL] cancel
[CANCEL] never mind
[CANCEL] forget it
[CANCEL] cancel please
[CANCEL] cancel that
[CANCEL] cancel that please

[STARTOVER] start over
[STARTOVER] restart
[STARTOVER] start again

[HELP] about this skill
[HELP] about this skill please
[HELP] explain this skill
[HELP] explain this skill please
[HELP] explain yourself
[HELP] explain yourself please
[HELP] get help
[HELP] get help please
[HELP] help
[HELP] help me
[HELP] help me please
[HELP] help menu
[HELP] help menu please
[HELP] help options
[HELP] help options please
[HELP] help please
[HELP] how can i use you
[HELP] how do i do this
[HELP] how do i do this skill
[HELP] how do i navigate
[HELP] how do i use this
[HELP] how do i use this skill
[HELP] how do i use you
[HELP] how do you do this
[HELP] how do you do this skill
[HELP] how do you use this
[HELP] how do you use this skill
[HELP] how do you work
[HELP] how does it work
[HELP] how does this skill work
[HELP] how does this work
[HELP] i don't understand
[HELP] i'm confused
[HELP] open the help menu
[HELP] open the help menu please
[HELP] please get help
[HELP] please help
[HELP] please help me
[HELP] please offer help options
[HELP] please open the help menu
[HELP] please take me to the help menu
[HELP] please tell me about this skill
[HELP] please tell me help options
[HELP] please tell me how can i use you
[HELP] please tell me how do i do this
[HELP] please tell me how do i do this skill
[HELP] please tell me how do i navigate
[HELP] please tell me how do i use this
[HELP] please tell me how do i use this skill
[HELP] please tell me how do i use you
[HELP] please tell me how do you do this
[HELP] please tell me how do you do this skill
[HELP] please tell me how do you use this
[HELP] please tell me how do you use this skill
[HELP] please tell me how do you work
[HELP] please tell me how does it work
[HELP] please tell me how does this skill work
[HELP] please tell me how does this work
[HELP] please tell me more about this skill
[HELP] please tell me what am i supposed to do now
[HELP] please tell me what can i ask
[HELP] please tell me what can i ask you
[HELP] please tell me what can i do
[HELP] please tell me what can i say
[HELP] please tell me what can i use this for
[HELP] please tell me what can you do
[HELP] please tell me what can you tell me
[HELP] please tell me what commands can i ask
[HELP] please tell me what commands can i say
[HELP] please tell me what do i do
[HELP] please tell me what do i do next
[HELP] please tell me what do you do
[HELP] please tell me what questions can i ask
[HELP] please tell more more about what I can do
[HELP] tell me about this skill
[HELP] tell me about this skill please
[HELP] tell me how can i use you
[HELP] tell me how can i use you please
[HELP] tell me how do i do this
[HELP] tell me how do i do this please
[HELP] tell me how do i do this skill
[HELP] tell me how do i do this skill please
[HELP] tell me how do i navigate
[HELP] tell me how do i navigate please
[HELP] tell me how do i use this
[HELP] tell me how do i use this please
[HELP] tell me how do i use this skill
[HELP] tell me how do i use this skill please
[HELP] tell me how do i use you
[HELP] tell me how do i use you please
[HELP] tell me how do you do this
[HELP] tell me how do you do this please
[HELP] tell me how do you do this skill
[HELP] tell me how do you do this skill please
[HELP] tell me how do you use this
[HELP] tell me how do you use this please
[HELP] tell me how do you use this skill
[HELP] tell me how do you use this skill please
[HELP] tell me how do you work
[HELP] tell me how do you work please
[HELP] tell me how does it work
[HELP] tell me how does it work please
[HELP] tell me how does this skill work
[HELP] tell me how does this skill work please
[HELP] tell me how does this work
[HELP] tell me how does this work please
[HELP] tell me more about this skill
[HELP] tell me more about this skill please
[HELP] tell more more about what I can do
[HELP] tell more more about what I can do please
[HELP] what am i supposed to do now
[HELP] what can i ask
[HELP] what can i ask you
[HELP] what can i do
[HELP] what can i say
[HELP] what can i use this for
[HELP] what can you do
[HELP] what can you tell me
[HELP] what commands can i ask
[HELP] what commands can i say
[HELP] what do i do
[HELP] what do i do next
[HELP] what do you do
[HELP] what questions can i ask
[HELP] learn more about this skill
[HELP] teach me more about this skill
  `
}
})();
