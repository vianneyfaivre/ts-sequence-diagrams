# Typescript Sequence Diagrams

UML Sequence Diagrams editor, built with Jison, Typescript and SVG.js.

Inspired by [Web Sequence Diagrams](https://www.websequencediagrams.com/) and [js-sequence-diagrams](https://bramp.github.io/js-sequence-diagrams/)

## Local Development

### Webpack dev server

```
npm run start
```

Open one of the HTML samples in `test/`.

### Build the Jison grammar

```
npm install jison -g
npm run build-grammar
```

## Release 

```
npm run build-prod
```

The released javascript file will be placed into `dist/`.