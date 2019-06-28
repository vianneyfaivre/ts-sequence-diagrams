import Actor from "../model/Actor";
import * as Snap from 'snapsvg';
import Signal from "../model/Signal";

export default class SvgEngine {

    paper: Snap.Paper;
    actors: Snap.Element[];

    constructor(svgElementId: string) {
        var el = document.getElementById(svgElementId) as unknown as SVGElement;
        this.paper = Snap(el);
        this.actors = [];
    }

    drawSignals(signals: Signal[]) {
        for(const signal of signals) {
            this.drawSignal(signal);
        }
    }

    drawSignal(signal: Signal) {
        const DISTANCE_BETWEEN_SIGNALS = 50;
        const MARKER_END = this.paper.path('M 0 0 L 5 2.5 L 0 5 z').marker(0, 0, 5, 5, 5, 2.5);

        const rectActorA = this.actors.filter(actor => actor.attr("actor-name") === signal.actorA.name).pop();
        const rectActorB = this.actors.filter(actor => actor.attr("actor-name") === signal.actorB.name).pop();

        if(rectActorA && rectActorB) {
            const signalAX = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
            const signalBX = (rectActorB.getBBox().width / 2) + rectActorB.getBBox().x;
            const signalY = rectActorA.getBBox().h + DISTANCE_BETWEEN_SIGNALS;

            var signalLine = this.paper.line(signalAX, signalY, signalBX, signalY);
            signalLine.attr({
                "stroke": "black",
                "stroke-width": 2,
                'markerEnd': MARKER_END
            });
        } else {
            console.warn(`Could not draw signal: ${signal}`);
        }
    }

    drawActors(actors: Actor[]) {
        var offsetX = 0;
        const DISTANCE_BETWEEN_ACTORS = 200;

        for (var actorName in actors) {

            var actor = actors[actorName];

            var actorRect = this.drawActor(actor, offsetX, 0);
            this.actors.push(actorRect);

            offsetX += DISTANCE_BETWEEN_ACTORS;
        }
    }

    drawActor(actor: Actor, x: number, y: number) {

        const RECT_WIDTH = 100;
        const RECT_HEIGHT = 50;
        const LIFE_LINE_HEIGHT = 500;

        console.log(`Drawing Actor ${actor.name}`);

        var rect: Snap.Element = this.drawRect(x, y, RECT_WIDTH, RECT_HEIGHT);
        rect.attr({
            "actor-name": actor.name
        });

        // align center
        var textX = (RECT_WIDTH / 2) + x;
        var textY = RECT_HEIGHT / 2;
        var text: Snap.Element = this.drawText(textX, textY, actor.name);

        var lineX = x + (RECT_WIDTH / 2);
        var lineY1 = RECT_HEIGHT;
        var lineY2 = RECT_HEIGHT + LIFE_LINE_HEIGHT;

        var lifeLine = this.paper.line(lineX, lineY1, lineX, lineY2);
        lifeLine.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        return rect;
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