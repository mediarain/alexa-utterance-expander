var Promise = require('bluebird')
  , request = require('request')
  , post = Promise.promisify(request.post)
  , get = Promise.promisify(request.get)
  , _ = require('lodash')
  , cheerio = require('cheerio')
;

// This is an unfinished effort to write something that will automatically update the Interaction model in an
// alexa skill. The APIs to do so work, but I've not been able to get the login to work correctly yet. So
// far it is popping up the CAPTCHA every time

function DeveloperPortal(options) {
  this.options = options || {};
  this.jar = request.jar();
}

DeveloperPortal.prototype.login = function(username, password) {
  var self = this
    , options = this.options
  ;
  return get({
    url: 'https://developer.amazon.com/login.html',
    proxy: options.proxy,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true,
    jar: self.jar
  }).then(function(res){
    var $ = cheerio.load(res.body);
    var $form = $('#ap_signin_form')
    var form = {
      email: username,
      password: password
    };
    $form.find('input[type="hidden"]').each(function(){
      var $this = $(this);
      form[$this.attr('name')] = $this.attr('value');
    });
    return post({
      url: $form.attr('action'),
      proxy: options.proxy,
      strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true,
      form: form,
      jar: self.jar
    });
  })
  .then(function(){
    self.isLoggedIn = true;
    return self;
  });
}

DeveloperPortal.prototype.openApplication = function(applicationId) {
  return new DeveloperPortalApplication(this,applicationId);
}

function DeveloperPortalApplication(portal,applicationId) {
  this.portal = portal;
  this.applicationId = applicationId;
  this.options = this.portal.options;
}

// model = {
//   intents: ... The intents.json schema,
//   slots: [{name: slotName, lines: ['blah']}]
//   utterances: ['LaunchIntent blah'] or a \n delimited string
// }
DeveloperPortalApplication.prototype.setInteractionModel = function(model) {
  var self = this
    , amzModel = transformInteractionModelToAmzFormat(model)
    , form = {}
    , options = self.options
  ;
    form[JSON.stringify(amzModel)] = ''; //They're doing the post wrong. It's JSON that's acting as the key of form. Wierd
    console.log(self.portal.jar);
    return post({
      url: 'https://developer.amazon.com/edw/ajax/ask/updateApplicationModels',
      proxy: options.proxy,
      strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true,
      form: form,
      jar: self.portal.jar
    }).then(function (res) {
      return true;
    })

  function transformInteractionModelToAmzFormat(model) {
    return {
      applicationId: self.applicationId,
      modelDef: {
        models: model.intents,
        testCases: _.isArray(model.utterances) ? model.utterances.join('\n') : model.utterances,
        catalogs: _.map(model.slots,function(slot){
          return { name: slot.name, entities: _.map(slot.lines,line => ({value: line.trim()})) }
        }),
        "amsVersion": 5,
      }
    }
  }
}

function doGet(url,options) {
  var req = {
    url: url,
    proxy: options.proxy,
    strictSSL: _.has(options, 'strictSSL') ? options.strictSSL : true
  };
  return get(req).then(function(res){
    console.log(res.data);
    return res;
  });
}

module.export = DeveloperPortal;

var dp = new DeveloperPortal({
  "proxy": "http://localhost:8888",
  "strictSSL": false
});
dp.login('mitchellh@gmail.com','lingoland42')
.then(function(portal){
  return portal.openApplication('amzn1.echo-sdk-ams.app.a1867ec0-c130-45b8-aaa9-da674088de89')
})
.then(function(app){
  return app.setInteractionModel({
     intents: {"intents": [{"intent": "SayANameIntent", "slots": [ {"name": "name", "type": "AMAZON.US_FIRST_NAME" } ] } ]},
     utterances: "SayANameIntent my name is {name}\nSayANameIntent my name is {name} and that is a cool name\nSayANameIntent blah bla",
     slots :[{"name":"ASLOT","lines": ['a','b','c'] } ]
  });
})
;

