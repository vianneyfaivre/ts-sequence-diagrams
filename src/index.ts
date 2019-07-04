import Parser from "./parser/Parser";
import ParserScope from "./parser/ParserScope";
import SvgEngine from "./draw/SvgEngine";

export default class SequenceDiagram {

    parser: Parser;
    data: ParserScope;

    constructor() {
        this.parser = new Parser();
    }

    load(input: string) {
        console.log("** PARSING **")
        
        const el = document.getElementById(input);
        
        if(el) {
            this.data = this.parser.parse(el.innerHTML);
        } else {
            this.data = this.parser.parse(input)
        }

        this.parser = null;
    }

    draw(htmlElementId: string) {
        console.log("** DRAWING **");
        const svgEngine = new SvgEngine(htmlElementId);
        svgEngine.drawActors(this.data.actors);
        svgEngine.drawSignals(this.data.signals);
        svgEngine.printCurrentState();
    }
}

// Export the main class in the window object
(<any>globalThis).SequenceDiagram = SequenceDiagram;