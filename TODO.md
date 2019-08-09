# TODO

## Features

* Other kind of blocks: opt, alt, etc...
* Participants order
* Notes
* Different themes
* redraw function

## Tech Features

* Error handling
  * use exceptions: ParsingError, DrawingError
  * use error codes
* rewrite logs to have a prefix with the function name

## Bugs

* Destroy
  * Can't destroy an actor if it has not been created by a signal 
  * Actor destroyed then recreated
  * Double Destroy
* Trim messages
* Empty svg container before drawing