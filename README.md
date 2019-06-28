# Build the grammar

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

 # Run

```
npm run-script watch
```

Open `./test/basic.html`