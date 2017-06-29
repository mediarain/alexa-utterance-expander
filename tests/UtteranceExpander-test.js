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

  function itIs(name, input, exptected){
    it(name, function(){
      var actual = sut(input);
      assert.equal(actual,exptected);
    })
  }

  it('does not carry extension of built in intents over multiple executions',function(){
      var actual = sut(`[PLEASE] YOOO\nBlahIntent blah [PLEASE]`);
      assert.include(actual,'YOOO');
      var actual2 = sut(`BlahIntent blah [PLEASE]`);
      assert.notInclude(actual2,'YOOO');
  })

  describe('Parse Line Anatomy',function(){
    it('Parses the line anatomy',function(){
      var actual = sut.parseLineAnatomy("LaunchIntent blah [blah] foo [blah] bat",{blah: [1,2,3]});
      assert.deepEqual(actual,[['LaunchIntent blah '],[1,2,3],[' foo '],[1,2,3],[' bat']]);
    })
    it('Parses the line anatomy of something w/o permutations',function(){
      var actual = sut.parseLineAnatomy("LaunchIntent blah",{blah: [1,2,3]});
      assert.deepEqual(actual,[['LaunchIntent blah']]);
    })
  });

})
