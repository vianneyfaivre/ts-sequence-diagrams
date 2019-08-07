#!/bin/bash

jison src/dao/grammar/SequenceDiagram.jison --outfile src/dao/grammar/SequenceDiagram.js --module-type js

head -n -2 src/dao/grammar/SequenceDiagram.js > tmp_build_grammar

echo "Parser.prototype.parse = parser.parse;" >> tmp_build_grammar
echo "return new Parser;" >> tmp_build_grammar
echo "})();" >> tmp_build_grammar
echo "export default SequenceDiagram;" >> tmp_build_grammar

mv tmp_build_grammar src/dao/grammar/SequenceDiagram.js