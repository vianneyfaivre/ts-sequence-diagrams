# Typescript Sequence Diagrams

## TODO

Features:

* Text boundaries
* Length of the actor line
* Signal that creates an actor
  * avoid having the same actor simple vs created by signal
  * avoid having an actor trying to create itself
  * cascading actor creation
  * backward actor creation
  * have a test/actor-creation.html
* Signal that destroys an actor
* Notes
* Loops
* Handle incorrect inputs
* Compute SVG size based on what has to be drawn
* Participants order
* Diagram title

Bugs:

* trim messages
* padding for root svg object

Tech stuff:

* Dependency injection http://inversify.io/
* Move test code from index.ts to test/basic.html
* Error handling
  * use exceptions
  * use error codes

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