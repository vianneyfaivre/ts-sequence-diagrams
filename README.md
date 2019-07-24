# Typescript Sequence Diagrams

## TODO

Features:
* Loops
* Participants order
* Notes
* Actor destroyed then recreated
* Different themes
* Destroy actors even if they were not created by a signal

Tech Features:
* Error handling
  * use exceptions: ParsingError, DrawingError
  * use error codes
* silent logs

Bugs:
* Double Destroy
* Handle incorrect inputs
* trim messages

Site:
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