# Typescript Sequence Diagrams

## TODO

Features:

* Text boundaries
* Loops
* Notes
* Handle incorrect inputs
* Compute SVG size based on what has to be drawn
* Participants order
* Diagram title
* Draw on input/textarea change
* Actor destroyed then recreated

Bugs:

* long text bug see /long_text.html
* req from B to A see complex.html
* trim messages
* padding for root svg object

Tech stuff:

* Error handling
  * use exceptions
  * use error codes
* Automate the grammar build (use make)
* use https://svgjs.com instead of snap
* silent logs

## Build the grammar

Build the grammar using Jison:

```
npm install jison -g
jison src/dao/grammar/SequenceDiagram.jison --outfile src/dao/grammar/SequenceDiagram.js --module-type js
```

To export the generated code as a module, update the end of SequenceDiagram.js:
```
Parser.prototype.parse = parser.parse;
return new Parser;
})();
export default SequenceDiagram;
```

## Run

```
npm run-script watch
```

Open `./test/basic.html`