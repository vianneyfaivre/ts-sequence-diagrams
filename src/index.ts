import Parser from "./parser/Parser";
import ParserScope from "./parser/ParserScope";
import SvgEngine from "./draw/SvgEngine";

var parser = new Parser();
var data: ParserScope = parser.parse("A->B: Does something");

var svgEngine = new SvgEngine("diagram-container");

svgEngine.drawActors(data.actors);