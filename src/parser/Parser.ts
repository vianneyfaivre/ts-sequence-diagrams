import ParserScope from './ParserScope';
import SequenceDiagram from '../grammar/SequenceDiagram';

export default class Parser {
    
    parse(input: string): ParserScope {
        SequenceDiagram.yy = new ParserScope();
        var parserScope = SequenceDiagram.parse(input);
        return parserScope as unknown as ParserScope;
    }
}