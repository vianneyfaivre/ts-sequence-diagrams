
import { SvgEngine } from "./service/SvgEngine";
import ParserEngine from "./facade/ParserEngine";
import { SequenceDiagramData } from "./dao/parser/SequenceDiagramData";

export default class SequenceDiagram {

    parser: ParserEngine;
    data: SequenceDiagramData;
    svgEngine: SvgEngine;

    constructor() {
        this.parser = new ParserEngine();
    }

    load(input: string) {
        console.log("** PARSING **");
        this.data = this.parser.load(input);
    }

    draw(htmlElementId: string) {
        this.svgEngine = new SvgEngine(htmlElementId);

        let hasTitle = false;
        if(this.data.title && this.data.title.trim() !== '') {
            hasTitle = true;
        }
        
        this.svgEngine.drawActors(this.data.actors, hasTitle);
        this.svgEngine.drawSignals(this.data.signals, hasTitle);
        this.svgEngine.adjustActorsAndSignals();

        if(hasTitle) {
            this.svgEngine.drawTitle(this.data.title);
        }

        this.svgEngine.drawBlocks(this.data.allBlocksStack);
        this.svgEngine.adjustSignalsOverlappedByBlocks();

        this.svgEngine.resizeSvg();
    }

    debug() {
        console.log("** PRINTING STATE **");
        this.svgEngine.printCurrentState();
    }
}

// Export the main class in the window object
(<any>globalThis).SequenceDiagram = SequenceDiagram;