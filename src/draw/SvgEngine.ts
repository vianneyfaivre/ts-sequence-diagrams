import Actor from "../model/Actor";
import * as Snap from 'snapsvg';
import {LineType, Signal} from "../model/Signal";
import {ShapesGenerator, LineOption, TextOption} from "./ShapesGenerator";

const DISTANCE_BETWEEN_SIGNALS = 50;
const DISTANCE_BETWEEN_ACTORS = 200;

export default class SvgEngine {

    actors: Snap.Element[];
    shapesGenerator: ShapesGenerator;

    constructor(svgElementId: string) {
        var el = document.getElementById(svgElementId) as unknown as SVGElement;
        const paper = Snap(el);
        this.actors = [];
        this.shapesGenerator = new ShapesGenerator(paper);
    }

    drawSignals(signals: Signal[]) {
        var offsetY = DISTANCE_BETWEEN_SIGNALS;

        for(const signal of signals) {
            this.drawSignal(signal, offsetY);

            if(signal.toSameActor()) {
                offsetY += DISTANCE_BETWEEN_SIGNALS * 2;
            } else {
                offsetY += DISTANCE_BETWEEN_SIGNALS;
            }
        }
    }

    drawSignal(signal: Signal, offsetY: number) {
        const rectActorA = this.actors.filter(actor => actor.attr("actor-name") === signal.actorA.name).pop();
        const rectActorB = this.actors.filter(actor => actor.attr("actor-name") === signal.actorB.name).pop();
        
        if(rectActorA && rectActorB) {
            
            if(signal.toSameActor()) {
                const SIGNAL_SELF_WIDTH = 25;
                const SIGNAL_SELF_HEIGHT = 50;
                const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
                const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

                /*
                       y1

                x1   ---       x2
                       | text
                x1   <--       x2

                       y2
                */
                const x1 = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
                const x2 = x1 + SIGNAL_SELF_WIDTH;
                const y1 = rectActorA.getBBox().h + offsetY;
                const y2 = y1 + SIGNAL_SELF_HEIGHT;
                const textX = x1 + SIGNAL_SELF_TEXT_OFFSET_X;
                const textY = y1 + SIGNAL_SELF_TEXT_OFFSET_Y;

                this.shapesGenerator.drawLine(x1, x2, y1, y1);
                this.shapesGenerator.drawLine(x2, x2, y1, y2);
                this.shapesGenerator.drawLine(x2, x1, y2, y2, [LineOption.END_MARKER]);

                var text = this.shapesGenerator.drawText(textX, textY, signal.message);

            } else {
                const SIGNAL_TEXT_OFFSET_X = 5;
                const SIGNAL_TEXT_OFFSET_Y = 5;

                const signalAX = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
                const signalBX = (rectActorB.getBBox().width / 2) + rectActorB.getBBox().x;
                const signalY = rectActorA.getBBox().h + offsetY;
                const dottedLine = signal.lineType === LineType.RESPONSE;

                const options = [LineOption.END_MARKER];
                if(dottedLine) {
                    options.push(LineOption.DOTTED);
                }

                this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);
    
                const signalGoingForward = (signalAX - signalBX) < 0;
    
                if(signalGoingForward) {
                    console.log(`Signal going forward from ${signal.actorA.name} to ${signal.actorB.name}`);
                    const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
                    const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
                    this.shapesGenerator.drawText(textX, textY, signal.message);
                } else {
                    console.log(`Signal going backward from ${signal.actorA.name} to ${signal.actorB.name}`);
                    
                    // First, draw the text
                    var textX = signalAX - SIGNAL_TEXT_OFFSET_X;
                    const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
                    var text = this.shapesGenerator.drawText(textX, textY, signal.message);
                    
                    // Get its width so it can be moved right
                    const textWidth = text.getBBox().w;
    
                    // Remove the current text
                    text.remove();
    
                    // And create a new one that will be correctly placed
                    textX = textX - textWidth;
                    text = this.shapesGenerator.drawText(textX, textY, signal.message);
                }
            }
        } else {
            console.warn(`Could not draw signal: ${signal}`);
        }
    }

    drawActors(actors: Actor[]) {
        var offsetX = 0;

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

        var rect = this.shapesGenerator.drawRect(x, y, RECT_WIDTH, RECT_HEIGHT);
        rect.attr({
            "actor-name": actor.name
        });

        var textX = (RECT_WIDTH / 2) + x;
        var textY = RECT_HEIGHT / 2;
        this.shapesGenerator.drawText(textX, textY, actor.name, [TextOption.CENTERED]);

        var lineX = x + (RECT_WIDTH / 2);
        var lineY1 = RECT_HEIGHT;
        var lineY2 = RECT_HEIGHT + LIFE_LINE_HEIGHT;

        this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

        return rect;
    }
}