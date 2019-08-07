# Typescript Sequence Diagrams

## TODO

Features:
* Other kind of blocks: opt, alt, etc...
* Participants order
* Notes
* Actor destroyed then recreated
* Different themes

Tech Features:
* Error handling
  * use exceptions: ParsingError, DrawingError
  * use error codes
* rewrite logs to have a prefix with the function name
* Test : describe this app
* build --production

Bugs:
* Can't destroy an actor if it has not been created by a signal
* Double Destroy
* trim messages

Site:
* use https://mithril.js.org/
* Textarea + SVG 
* Draw on input/textarea change
* Display parsing errors
* Clickable samples
* Export as PNG / SVG
* About Page
* Support Page
* Save in localStorage

## Build the grammar

Build the grammar using Jison:

```
npm install jison -g
npm run build-grammar
```

## Run

```
npm run start
```

Open `./test/basic.html`