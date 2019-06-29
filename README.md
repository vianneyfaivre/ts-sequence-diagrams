# Typescript Sequence Diagrams

## TODO

Features:

* Text boundaries
* Signal that creates an actor
* Signal that destroys an actor
* Notes
* Loops
* Handle incorrect inputs
* Compute SVG size based on what has to be drawn
* Participants order

Tech stuff:

* Dependency injection http://inversify.io/
* Move test code from index.ts to test/basic.html

## Build the grammar

```
npm install jison -g
jison src/grammar/SequenceDiagram.jison --outfile src/grammar/SequenceDiagram.js --module-type js
```

export the generated code as a module. SequenceDiagram.js:

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