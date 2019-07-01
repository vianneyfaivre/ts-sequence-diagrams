import * as Snap from 'snapsvg';

enum LineOption {
    END_MARKER,
    DOTTED
}

enum TextOption {
    CENTERED
}

class ShapesGenerator {
    
    paper: Snap.Paper;

    constructor(paper: Snap.Paper) {
        this.paper = paper;
    }

    drawLine(x1: number, x2: number, y1: number, y2: number, options?: LineOption[]) {

        const line = this.paper.line(x1, y1, x2, y2);
        line.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        if(options && options.includes(LineOption.END_MARKER)) {
            const endMarker = this.paper.path('M 0 0 L 5 2.5 L 0 5 z').marker(0, 0, 5, 5, 5, 2.5);
            line.attr({
                'markerEnd': endMarker
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

}

export {LineOption, TextOption, ShapesGenerator};