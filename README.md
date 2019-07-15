# Typescript Sequence Diagrams

## TODO

Features:
* Loops
* Notes
* Handle incorrect inputs
* Participants order
* Diagram title
* Actor destroyed then recreated

Bugs:
* trim messages
* tests use A,B,C,...

Site:
* Textarea + SVG 
* Draw on input/textarea change
* Clickable samples
* Export as PNG
* About Page
* Support Page

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
npm run build-grammar
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