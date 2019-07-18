import {Svg, Element, Container} from "@svgdotjs/svg.js";
import { CrossElement, LineOption, TextOption, Dimensions } from './model';

/**
 * Generates basic items: rect, text, lines, ...
 */
export class ShapesGenerator {
    
    readonly paper: Svg;
    readonly endMarker: Element;
    readonly startMarker: Element;

    constructor(container: HTMLElement) {
        this.paper = new Svg().addTo(container);
        this.endMarker = this.paper.path('M 0 0   L 5 2.5   L 0 5   z')//.marker(5, 5, 5, 2.5);
        this.startMarker = this.paper.path('M 0 2.5   L 5 5   L 5 0   z')//.marker(5, 5, 0, 2.5);
    }

    drawLine(x1: number, x2: number, y1: number, y2: number, options?: LineOption[]) {

        const line = this.paper.line(x1, y1, x2, y2);
        line.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        if(options && options.includes(LineOption.END_MARKER)) {
            line.attr({
                'markerEnd': this.endMarker
            });
        }

        if(options && options.includes(LineOption.START_MARKER)) {
            line.attr({
                'markerStart': this.startMarker
            });
        }

        if(options && options.includes(LineOption.DOTTED)) {
            line.attr({
                "stroke-dasharray": "5,5"
            });
        }

        return line;
    }

    drawRect(x: number, y: number, w: number, h: number): Element {
        return this.paper.rect(w, h)
                            .move(x, y)
                            .attr({
                                'stroke': 'black',
                                'stroke-width': 2,
                                'fill': 'white'
                            });
    }

    drawText(x: number, y: number, text: string, options?: TextOption[]) {

        var t = this.paper.text('').tspan(text).attr({ x: x, y: y });

        if(options && options.includes(TextOption.CENTERED)) {
            t.attr({
                "dominant-baseline": "middle",
                "text-anchor": "middle"
            });
        }
         
        return t;
    }

    drawCross(x: number, y: number): CrossElement {

        const x1 = x - (Dimensions.CROSS_WIDTH / 2);
        const x2 = x + (Dimensions.CROSS_WIDTH / 2);
        const y1 = y - (Dimensions.CROSS_WIDTH / 2);
        const y2 = y + (Dimensions.CROSS_WIDTH / 2);

        const line1 = this.paper.line(x1, y1, x2, y2);
        line1.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        const line2 = this.paper.line(x1, y2, x2, y1);
        line2.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        return new CrossElement(line1, line2);
    }

    translateElements(elements: Element[], offsetX: number) {
        // WARN: elements must not be deleted from the SVG because some objects have references that may point to them
        elements
            .filter(element => element != null)
            .forEach(element => this._translateElement(element, offsetX));
    }

    _translateElement(element: Element, offsetX: number) {

        let fullOffsetX = offsetX;

        // This hack is a dirty way to have multiple x-translations...  
        // Keep in mind that adding more transformations elsewhere might break the entire offset mechanism
        const existingTransformation = element.transform();

        if(existingTransformation) {
            // retrieve the existing X offset in the transformation "tx,y"
            const parts = existingTransformation.toString().split(",");
            if(parts.length > 0 && parts[0].startsWith("t") && parts[0].length > 1) {
                const existingOffsetX = +parts[0].substring(1, parts[0].length);
                if(existingOffsetX > 0) {
                    fullOffsetX += existingOffsetX;
                }
            }
        }

        const translationX = `translate(${fullOffsetX},0)`;
        element.transform(translationX);
    }

}