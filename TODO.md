# TODO

## Features

* Other kind of blocks: opt, alt, etc...
* Participants order
* Notes
* Actor destroyed then recreated
* Different themes

## Tech Features

* Error handling
  * use exceptions: ParsingError, DrawingError
  * use error codes
* rewrite logs to have a prefix with the function name
* build --production

## Bugs

* Can't destroy an actor if it has not been created by a signal
* Double Destroy
* trim messages
* Empty svg container before drawing

## Site

* Do a production build
* 2 columns: Textarea + SVG 
* Draw on input/textarea change
* Save in localStorage