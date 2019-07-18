import {SequenceDiagramData} from './SequenceDiagramData';
import SequenceDiagram from '../grammar/SequenceDiagram';

export default class Parser {
    
    parse(input: string): SequenceDiagramData {
        SequenceDiagram.yy = new SequenceDiagramData();
        var parserScope = SequenceDiagram.parse(input);
        return parserScope as unknown as SequenceDiagramData;
    }
}