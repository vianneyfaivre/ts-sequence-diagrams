import * as Snap from 'snapsvg';

export enum LineOption {
    END_MARKER,
    START_MARKER,
    DOTTED
}

export enum TextOption {
    CENTERED
}

/**
 * Generates basic items: rect, text, lines, ...
 */
export class ShapesGenerator {
    
    paper: Snap.Paper;
    readonly endMarker: Snap.Element;
    readonly startMarker: Snap.Element;

    constructor(container: SVGElement) {
        this.paper = Snap(container);
        this.endMarker = this.paper.path('M 0 0   L 5 2.5   L 0 5   z').marker(0, 0, 5, 5, 5, 2.5);
        this.startMarker = this.paper.path('M 0 2.5   L 5 5   L 5 0   z').marker(0, 0, 5, 5, 0, 2.5);
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

    drawRect(x: number, y: number, w: number, h: number) {
        return this.paper.rect(x, y, w, h)
                            .attr({
                                'stroke': 'black',
                                'stroke-width': 2,
                                'fill': 'white'
                            });
    }

    drawText(x: number, y: number, text: string, options?: TextOption[]) {
        var t = this.paper.text(x, y, text);

        if(options && options.includes(TextOption.CENTERED)) {
            t.attr({
                "dominant-baseline": "middle",
                "text-anchor": "middle"
            });
        }
         
        return t;
    }

    drawCross(x: number, y: number) {
        const SQUARE_SIDE_WIDTH = 20;

        const x1 = x - (SQUARE_SIDE_WIDTH / 2);
        const x2 = x + (SQUARE_SIDE_WIDTH / 2);
        const y1 = y - (SQUARE_SIDE_WIDTH / 2);
        const y2 = y + (SQUARE_SIDE_WIDTH / 2);

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
    }
    
    extendElement(element: Snap.Element, x1: number, x2: number) {
        // WARN: elements must not be deleted from the SVG because some objects have references that may point to them
        element.attr(
            {
                "x1": x1,
                "x2": x2
        });
    }

    translateElements(elements: Snap.Element[], offsetX: number) {
        // WARN: elements must not be deleted from the SVG because some objects have references that may point to them
        elements
            .filter(element => element != null)
            .forEach(element => this.translateElement(element, offsetX));
    }

    translateElement(element: Snap.Element, offsetX: number) {
        const translationX = `translate(${offsetX},0)`;
        element.transform(translationX);
    }

}