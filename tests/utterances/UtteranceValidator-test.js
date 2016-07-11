var assert = require('chai').assert
  , sut = require('../../utterances/UtteranceValidator')
;

describe('UtteranceValidator',function(){
  it('It passes a valid file',function(){
    var errors = sut('LaunchIntent go for it\nLaunchIntent make it happen');
    assert.equal(errors,[]);
  })
});
