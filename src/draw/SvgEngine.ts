import Actor from "../model/Actor";
import * as Snap from 'snapsvg';

export default class SvgEngine {

    paper: Snap.Paper;

    constructor(svgElementId: string) {
        var el = document.getElementById(svgElementId) as unknown as SVGElement;
        this.paper = Snap(el);
    }

    drawActors(actors: Actor[]) {
        var offsetX = 0;
        for (var actorName in actors) {

            var actor = actors[actorName];

            this.drawActor(actor, offsetX, 0);

            offsetX += 200;
        };
    }

    drawActor(actor: Actor, x: number, y: number) {

        const RECT_WIDTH = 100;
        const RECT_HEIGHT = 50;

        console.log(`Drawing Actor ${actor.name}`);

        var rect: Snap.Element = this.drawRect(x, y, RECT_WIDTH, RECT_HEIGHT);

        // align center
        var textX = (RECT_WIDTH / 2) + x;
        var textY = RECT_HEIGHT / 2;
        var text: Snap.Element = this.drawText(textX, textY, actor.name);

        var lineX = x + (RECT_WIDTH / 2);
        var lineY1 = RECT_HEIGHT;
        var lineY2 = RECT_HEIGHT + 500;
        var lifeLine = this.paper.line(lineX, lineY1, lineX, lineY2);
        lifeLine.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        return text;
    }

    drawRect(x: number, y: number, w: number, h: number) {
        var rect = this.paper.rect(x, y, w, h);
        rect.attr({
            'stroke': 'black',
            'stroke-width': 2,
            'fill': 'white'
        });
        return rect;
    }

    drawText(x: number, y: number, text: string) {
        var t = this.paper.text(x, y, text);
        t.attr({
            "dominant-baseline": "middle",
            "text-anchor": "middle"
        });
        return t;
    }
}