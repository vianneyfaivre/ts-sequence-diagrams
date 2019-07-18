
import { SvgEngine } from "./service/SvgEngine";
import ParserEngine from "./facade/ParserEngine";
import { SequenceDiagramData } from "./dao/parser/SequenceDiagramData";
import { Svg, SVG } from "@svgdotjs/svg.js";

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
        this.svgEngine.drawActors(this.data.actors);
        this.svgEngine.drawSignals(this.data.signals);
        this.svgEngine.autoAdjust();
    }

    debug() {
        console.log("** PRINTING STATE **");
        this.svgEngine.printCurrentState();
    }
}

// Export the main class in the window object
(<any>globalThis).SequenceDiagram = SequenceDiagram;