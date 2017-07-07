var assert = require('chai').assert
  , sut = require('../UtteranceExpander')
;

describe('UtteranceExpander',function(){
  itIs('Passes through samples with no expansion points'
    ,'LaunchIntent go for it\nLaunchIntent make it happen'
    ,'LaunchIntent go for it\nLaunchIntent make it happen');

  itIs('Ignores slots that are not defined'
    ,'LaunchIntent go for it {please}\nLaunchIntent make it happen'
    ,'LaunchIntent go for it {please}\nLaunchIntent make it happen');

  itIs('Puts in content for expansion points that are defined'
    ,'[please] please\nLaunchIntent go for it [please]\nLaunchIntent make it happen'
    ,'LaunchIntent go for it please\nLaunchIntent make it happen');

  itIs('Puts in multiple contents for expansion points that are defined'
    ,'[please] please\n[please] if you would\nLaunchIntent go for it [please]\nLaunchIntent make it happen'
    ,'LaunchIntent go for it please\nLaunchIntent go for it if you would\nLaunchIntent make it happen');

  itIs('Supports multiple expansion points in a single line. And does combinatorics'
    ,'[please] please\n[please] if you would\n[ok] ok\n[ok] yeah\nLaunchIntent go for it [please] [ok]'
    ,'LaunchIntent go for it please ok\nLaunchIntent go for it if you would ok\nLaunchIntent go for it please yeah\nLaunchIntent go for it if you would yeah');

  itIs('Supports multiple of the same expansion points in a single line. And does combinatorics'
    ,'[please] please\n[please] if you would\nLaunchIntent go for it [please] [please]'
    ,'LaunchIntent go for it please please\nLaunchIntent go for it if you would please\nLaunchIntent go for it please if you would\nLaunchIntent go for it if you would if you would');

  itIs('Supports optional expansion points'
    ,'[please] please\n[please]\nLaunchIntent go for it [please]\nLaunchIntent make it happen'
    ,'LaunchIntent go for it please\nLaunchIntent go for it\nLaunchIntent make it happen');

  itIs('Keeps natural line breaks'
    ,'LaunchIntent go for it\n\nLaunchIntent make it happen'
    ,'LaunchIntent go for it\n\nLaunchIntent make it happen');

  itIs('Keeps natural line breaks with expansions'
    ,'[please] please\nLaunchIntent go for it [please]\n\n\nLaunchIntent make it happen'
    ,'LaunchIntent go for it please\n\n\nLaunchIntent make it happen');

  itIs('Uses the built in expansion slots'
    ,'LaunchIntent go for it [PLEASE]'
    ,'LaunchIntent go for it please\nLaunchIntent go for it');

  itIs('Recursively expands expansions that use other expansions'
    ,`[baz] woot\n[bar] [baz]\n[foo] [bar]\nLaunchIntent [foo]`
    ,'LaunchIntent woot');

  itIs('Recursively expands expansions that use other expansions when there are several options'
    ,`[baz] woot\n[baz] booyah\n[bar] [baz]\n[foo] [bar]\n[foo] etc\nLaunchIntent [foo]`
    ,'LaunchIntent woot\nLaunchIntent booyah\nLaunchIntent etc');

  itIs('Empty slots don\'t leave ghost spaces'
    , `[blank] \n[blank] bar\nLaunchIntent woot [blank] woot`
    , 'LaunchIntent woot woot\nLaunchIntent woot bar woot');

  itIs('Ignores commented lines'
    , `AIntent boo\n//Blah`
    , 'AIntent boo\n');

  function itIs(name, input, exptected){
    it(name, function(){
      var actual = sut(input);
      assert.equal(actual,exptected);
    })
  }

  it('Provides a good error message when an expansion cannot be found',function(){
      try {
        sut(`AnIntent [does not exist]`);
      }catch(e) {
        assert.equal(e,'Error: No definitions for [does not exist] on line 1')
      }
  })

  it('Provides a good error message when an expansion cannot be found in the expansions themselves',function(){
      try {
        sut(`[exists] [does not exist]\nAnIntent [exists]`);
      }catch(e) {
        assert.equal(e,'Error: No definitions for [does not exist] on line 1')
      }
  })

  it('does not carry extension of built in intents over multiple executions',function(){
      var actual = sut(`[PLEASE] YOOO\nBlahIntent blah [PLEASE]`);
      assert.include(actual,'YOOO');
      var actual2 = sut(`BlahIntent blah [PLEASE]`);
      assert.notInclude(actual2,'YOOO');
  })

  describe('Parse Line Expansion',function(){
    it('parses expansions recursively',function(){
      var [aexpansions, aextracted] = sut.parseExpansions("[baz] woot\n[bar] [baz]\n[foo] [bar]\nLaunchIntent [foo]");
      //console.log('Got expansions: ',JSON.stringify(aexpansions,null,2))
      assert.deepEqual(aexpansions,{'foo': [{txt: 'woot',lineNum:3}],'bar': [{txt: 'woot',lineNum: 2}], 'baz': [{txt:'woot',lineNum:1}]});
      assert.deepEqual(aextracted,[{txt: 'LaunchIntent [foo]',lineNum: 4}]);
    })

    it('parses expansions recursively and uses permutations',function(){
      var [aexpansions, aextracted] = sut.parseExpansions("[baz] woot\n[baz] booyah\n[bar] [baz]\n[foo] [bar]\nLaunchIntent [foo]");
      //console.log('Got expansions: ',JSON.stringify(aexpansions))
      assert.deepEqual(aexpansions,{"baz":[{"txt":"woot","lineNum":1},{"txt":"booyah","lineNum":2}],"bar":[{"txt":"woot","lineNum":3},{"txt":"booyah","lineNum":3}],"foo":[{"txt":"woot","lineNum":4},{"txt":"booyah","lineNum":4}]});
      assert.deepEqual(aextracted,[{txt: 'LaunchIntent [foo]',lineNum: 5}]);
    })

  });

  describe('Parse Line Anatomy',function(){
    it('Parses the line anatomy',function(){
      var actual = sut.parseLineAnatomy("LaunchIntent blah [blah] foo [blah] bat",{blah: [1,2,3].map(x => ({txt: x}))});
      assert.deepEqual(actual,[['LaunchIntent blah '],[1,2,3],[' foo '],[1,2,3],[' bat']]);
    })
    it('Parses the line anatomy of something w/o permutations',function(){
      var actual = sut.parseLineAnatomy("LaunchIntent blah",{});
      assert.deepEqual(actual,[['LaunchIntent blah']]);
    })
  });

})
