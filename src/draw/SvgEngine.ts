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

            this.drawActor(actor, offsetX, 0, 100, 100);

            offsetX += 200;
        };
    }

    drawActor(actor: Actor, x: number, y: number, w: number, h: number) {

        console.log(`Drawing Actor ${actor.name}`);

        var rect: Snap.Element = this.drawRect(x, y, w, h);

        var textX = ((w * 50) / 100) + x;
        var textY = ((h * 50) / 100);

        var text: Snap.Element = this.drawText(textX, textY, actor.name);

        text.attr({
            "dominant-baseline": "middle",
            "text-anchor": "middle"
        });

        return text;
    }

    drawRect(x: number, y: number, w: number, h: number) {
        return this.paper.rect(x, y, w, h).attr({
            'stroke': '#000000',
            'stroke-width': 2,
            'fill': '#fff'
        });
    }

    drawText(x: number, y: number, text: string) {
        var t = this.paper.text(x, y, text);
        return t;
    }
}