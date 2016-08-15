# alexa-utterance-expander
Write your Amazon Alexa utterances file in a simple-to-use DSL, and compile it to the full utternaces.
Re-use placeholders, and let the compiler handle the work of creating the many variations.

# Install

```bash
npm install alexa-utterance-expander
```

# Usage
Require the library;
```javascript
const UtteranceExpander = require('alexa-utterance-expander');
```

Define place holders
```javascript
console.log(UtteranceExpander(`
[game] game
[game] match
[game] round

[play] play
[play] start

LaunchIntent [play] a [game]
`));
```
generates

```javascript
LaunchIntent play a game
LaunchIntent play a match
LaunchIntent play a round
LaunchIntent start a game
LaunchIntent start a match
LaunchIntent start a round
```

Some built-in placeholders
* PLEASE
* YES
* NO
* NEXT
* REPEAT
* STOP
* CANCEL
* STARTOVER
* HELP

#From Gulp#
```javascript
gulp.task('compile', function (cb) {
    fs.readFile(path.join(__dirname,'interaction-model','utterances-src.txt'),function(err,file){
          if(err) return cb(err);
               var expanded = UtteranceExpaander(file);
                    fs.writeFile(path.join(__dirname,'interaction-model','utterances.txt'),expanded,cb);
                       
        });
         
    });

```
