const examples = {
  'introduction': `// Square brackets are expansion points
MyIntent Use [square brackets] for variations on a line

// Lines starting with square brackets define the options
[square brackets] squares brackets
[square brackets] crotchets
[square brackets] array notation
`,

'recursion': `[expansions can] expansions [can]
[expansions can] expansion points [can]

[can] can
[can] could
[can] might

LaunchIntent [expansions can] contain others
`
,
'build-ins': `// Some placeholders are built in.
// You can still extend them though.
[PLEASE] por favor
LaunchIntent start my skill [PLEASE]
`,

'optionals': `// Unlike slots, you can have optional expansions
[nice things to say] if you would
[nice things to say]
LaunchIntent start my skill [nice things to say]
`,

'slots': `// Slots can be used as you normally would
[some options] some {options}
[some options] a few {options}
[some options] something
LaunchIntent give me [some options]
`,

'complicated': `// Using optional slots and recursion,
// we can generate thousands of utterances from just a few lines
[with] with
[with] with a

// Can have one to three options
[options]
[options] [with] {optsone}
[options] [with] {optsone} and [with] {optstwo}
[options] [with] {optsone} and [with] {optstwo} and [with] {optsthree}
[options] [with] {optsone} [with] {optstwo} and [with] {optsthree}

// Size is optional
[size]
[size] {size}

[preWithOptions]
[preWithOptions] {preWithOptions}

[get me] get me
[get me] I want
[get me] give me
[get me] I'd like

AddItemIntent [get me] a [size] [preWithOptions] {item} [options]
AddItemIntent [get me] {quantity} [size] [preWithOptions] {item} [options]
`,

}

var editor =  Vue.component('editor',{
  template: `<div></div>`,
  props: ['value','disabled'],
  mounted: function(){
    var self = this;
    var cm = this.cmirrorEl = CodeMirror(self.$el,{
      value: self.value,
      lineNumbers: true,
      mode: 'utterance-mode',
      readOnly: this.disabled,
      theme: 'dracula'
    });
    cm.on("change",function(){
      //console.log('Emitting a change')
      self.$emit('input',cm.doc.getValue());
    })
  },
  watch: {
    value: function(val) {
      //console.log('Writing a change')
      if(val === this.cmirrorEl.doc.getValue()) return;
      this.cmirrorEl.doc.setValue(val);
    }
  }
})

var vm = new Vue({
  el: '#root',
  data: {
    src: localStorage.getItem('lastValue') || examples['introduction'],
    error: null,
    collapsed: false
  },
  methods: {
    toggleCollapse: function(e) {
      this.collapsed = !this.collapsed;
    },
    loadExample: function(name){
      this.src = examples[name];
    }
  },
  watch: {
    src: function(val) {
      localStorage.setItem('lastValue',val);
    }
  },
  computed: {
    toggleDir: function(){
      return this.collapsed ? '<' : '>';
    },
    dest: function(){
      try{
        let txt = UtteranceExpander(this.src);
        this.error = false;
        return txt;
      }catch(e) {
        this.error = e;
        return e.message;
      }
    }
  },
})

hljs.initHighlightingOnLoad();
