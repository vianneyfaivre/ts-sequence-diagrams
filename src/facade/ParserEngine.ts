import Parser from "../dao/parser/Parser";
import SequenceDiagramData from "../dao/parser/SequenceDiagramData";

export default class ParserEngine {

    parser: Parser;

    constructor() {
        this.parser = new Parser();
    }

    load(input: string): SequenceDiagramData {
        console.log("** PARSING **")
        
        const el = document.getElementById(input);
        let data;

        if(el) {
            data = this.parser.parse(el.innerHTML);
        } else {
            data = this.parser.parse(input)
        }

        this.parser = null;
        return data;
    }
}