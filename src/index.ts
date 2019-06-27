import Parser from "./parser/Parser";
import ParserScope from "./parser/ParserScope";
import SvgEngine from "./draw/SvgEngine";

var parser = new Parser();
var data: ParserScope = parser.parse("Vianney->Server: Does something");

var svgEngine = new SvgEngine("diagram-container");

svgEngine.drawActors(data.actors);
svgEngine.drawSignals(data.signals);