import Actor from "../model/Actor";
import * as Snap from 'snapsvg';
import {LineType, Signal, SignalType} from "../model/Signal";
import {ShapesGenerator, LineOption, TextOption} from "./ShapesGenerator";

const DISTANCE_BETWEEN_SIGNALS = 50;
const DISTANCE_BETWEEN_ACTORS = 200;

const ACTOR_RECT_WIDTH = 100;
const ACTOR_RECT_HEIGHT = 50;

const SIGNAL_SELF_WIDTH = 25;
const SIGNAL_SELF_HEIGHT = 50;
const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

const SIGNAL_TEXT_OFFSET_X = 5;
const SIGNAL_TEXT_OFFSET_Y = 5;

const SIGNAL_CREATION_WIDTH = 100;

export default class SvgEngine {

    actors: Snap.Element[];
    destroyedActors: Actor[];
    shapesGenerator: ShapesGenerator;

    constructor(svgElementId: string) {
        var el = document.getElementById(svgElementId) as unknown as SVGElement;
        const paper = Snap(el);
        this.actors = [];
        this.destroyedActors = [];
        this.shapesGenerator = new ShapesGenerator(paper);
    }

    drawSignals(signals: Signal[]) {
        
        var offsetY = DISTANCE_BETWEEN_SIGNALS;

        for(const signal of signals) {
            if(signal.type === SignalType.SIMPLE) {
                this._drawSignal(signal, offsetY);

                if(signal.toSameActor()) {
                    offsetY += DISTANCE_BETWEEN_SIGNALS * 2;
                } else {
                    offsetY += DISTANCE_BETWEEN_SIGNALS;
                }
            }
            else if(signal.type === SignalType.ACTOR_CREATION) {
                this._drawSignalAndActor(signal, offsetY);
                offsetY += DISTANCE_BETWEEN_SIGNALS + (ACTOR_RECT_HEIGHT / 2);
            }
            else if(signal.type === SignalType.ACTOR_DELETION) {
                this._destroyActor(signal, offsetY);
                offsetY += DISTANCE_BETWEEN_SIGNALS;
                this.destroyedActors.push(signal.actorA);
            }
        }

        // Draw actors lines for those who has not been destroyed 
        for(const i in this.actors) {
            const actor = this.actors[i];
            const actorName = actor.attr("actor-name");

            const alreadyDestroyed = this.destroyedActors.filter(a => a.name === actorName).pop();

            if(!alreadyDestroyed) {

                // Draw whole line
                const lineX = actor.getBBox().x + (ACTOR_RECT_WIDTH / 2);
                const lineY1 = actor.getBBox().y + ACTOR_RECT_HEIGHT;
                const lineY2 = offsetY + ACTOR_RECT_HEIGHT;
                this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

                // Draw bottom actor rect
                const rectX = lineX - (ACTOR_RECT_WIDTH / 2);
                const rectY = lineY2;
                var rect = this.shapesGenerator.drawRect(rectX, rectY, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

                // Draw text inside rectangle
                var textX = (ACTOR_RECT_WIDTH / 2) + rectX;
                var textY = (ACTOR_RECT_HEIGHT / 2) + lineY2;
                this.shapesGenerator.drawText(textX, textY, actorName, [TextOption.CENTERED]);
            }
        }
    }

    drawActors(actors: Actor[]) {

        var offsetX = 0;

        for (const actorName in actors) {

            var actor = actors[actorName];

            if(actor.createdBySignal === false) {
                var actorRect = this.drawActor(actor, offsetX, 0);
                this.actors.push(actorRect);
    
                offsetX += DISTANCE_BETWEEN_ACTORS;
            }
        }
    }

    drawActor(actor: Actor, x: number, y: number) {

        console.log(`Drawing Actor '${actor.name}'`);

        // Draw rectangle
        var rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);
        rect.attr({
            "actor-name": actor.name, 
            "actor-created-by-signal": `${actor.createdBySignal}`
        });

        // Draw text inside rectangle
        var textX = (ACTOR_RECT_WIDTH / 2) + x;
        var textY = ACTOR_RECT_HEIGHT / 2;
        this.shapesGenerator.drawText(textX, textY, actor.name, [TextOption.CENTERED]);

        return rect;
    }

    _drawActorCreatedBySignal(signal: Signal, x: number, y: number, offsetY: number) {

        console.log(`Drawing Actor '${signal.actorB.name}' created by a Signal`);

        // Draw rectangle
        var rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);
        rect.attr({
            "actor-name": signal.actorB.name, 
            "actor-created-by-signal": `${signal.actorB.createdBySignal}`
        });

        // Draw text inside rectangle
        var textX = (ACTOR_RECT_WIDTH / 2) + x;
        var textY = (ACTOR_RECT_HEIGHT / 2) + y;
        this.shapesGenerator.drawText(textX, textY, signal.actorB.name, [TextOption.CENTERED]);

        return rect;
    }

    _getActorElement(actor: Actor, createdBySignal: boolean) {
        return this.actors.filter(a => {
            const byName = a.attr("actor-name") === actor.name;
            const type = a.attr("actor-created-by-signal") === `${createdBySignal}`;
            return byName && type;
        }).pop();
    }

    _drawSignal(signal: Signal, offsetY: number) {
        const rectActorA: Snap.Element = this._getActorElement(signal.actorA, false);
        const rectActorB: Snap.Element = this._getActorElement(signal.actorB, false);

        const signalToSelf = signal.toSameActor();
        const classicActors = rectActorA && rectActorB;

        const rectActorACreatedBySignal: Snap.Element = this._getActorElement(signal.actorA, true);
        const rectActorBCreatedBySignal: Snap.Element = this._getActorElement(signal.actorB, true);

        if(signalToSelf) {
            this._drawSelfSignal(signal, offsetY, rectActorA);
        }
        else if(classicActors) {
            this._drawSignalFromAToB(signal, rectActorA, rectActorB, offsetY);
        } 
        else if(rectActorACreatedBySignal && rectActorBCreatedBySignal) {
            this._drawSignalFromAToB(signal, rectActorACreatedBySignal, rectActorBCreatedBySignal, offsetY);
        }
        else if(rectActorACreatedBySignal) {
            this._drawSignalFromAToB(signal, rectActorACreatedBySignal, rectActorB, offsetY);
        }
        else if(rectActorBCreatedBySignal) {
            this._drawSignalFromAToB(signal, rectActorA, rectActorBCreatedBySignal, offsetY);
        }
        else {
            console.error(`Can't draw ${signal}`);
        }
    }

    _drawSignalFromAToB(signal: Signal, rectActorA: Snap.Element, rectActorB: Snap.Element, offsetY: number) {
        console.log(`Drawing ${signal}`);

        // Draw Signal from actor A to actor B
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
            this._drawForwardSignal(signal, signalAX, signalY);
        } else {
            this._drawBackwardSignal(signal, signalAX, signalY);
        }
    }

    _drawForwardSignal(signal: Signal, signalAX: number, signalY: number) {
        console.log(`Drawing Forward ${signal}`);

        // Draw text
        const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
        const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
        this.shapesGenerator.drawText(textX, textY, signal.message);
    }

    _drawBackwardSignal(signal: Signal, signalAX: number, signalY: number) {
        console.log(`Drawing Backward ${signal}`);
                    
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

    _drawSelfSignal(signal: Signal, offsetY: number, rectActorA: Snap.Element) {
        console.log(`Drawing ${signal}`);
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

        // Draw self signal
        this.shapesGenerator.drawLine(x1, x2, y1, y1);
        this.shapesGenerator.drawLine(x2, x2, y1, y2);
        this.shapesGenerator.drawLine(x2, x1, y2, y2, [LineOption.END_MARKER]);

        // Draw text
        var text = this.shapesGenerator.drawText(textX, textY, signal.message);
    }

    _drawSignalAndActor(signal: Signal, offsetY: number) {
        var rectActorA = this._getActorElement(signal.actorA, false);
        if(!rectActorA) {

            rectActorA = this._getActorElement(signal.actorA, true);

            if(!rectActorA) {
                console.log(`Can't draw signal because Actor A '${signal.actorA}' has not been drawn yet`);
                return;
            }
        }
        
        const rectActorB = this._getActorElement(signal.actorB, true);
        if(rectActorB) {
            console.log(`Can't draw signal because Actor B '${signal.actorB}' has already been drawn`);
            return;
        }

        // Draw line to Actor rect
        const signalAX = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
        const signalBX = signalAX + SIGNAL_CREATION_WIDTH;
        const signalY = rectActorA.getBBox().h + offsetY;

        const options = [LineOption.END_MARKER];
        this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);

        // Draw text
        const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
        const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
        this.shapesGenerator.drawText(textX, textY, signal.message);

        // Draw Actor rect
        const rectX = signalBX;
        const rectY = signalY - (ACTOR_RECT_HEIGHT / 2);
        const actorB = this._drawActorCreatedBySignal(signal, rectX, rectY, offsetY);
        this.actors.push(actorB);
    }

    _destroyActor(signal: Signal, offsetY: number) {
        console.log(`Drawing line and cross for actor '${signal.actorA}'`);

        var actorElement = this._getActorElement(signal.actorA, true);
        if(!actorElement) {
            actorElement = this._getActorElement(signal.actorA, false);
        }

        if(actorElement) {

            // Draw actor line
            const x = actorElement.getBBox().x + (ACTOR_RECT_WIDTH / 2);
            const y1 = actorElement.getBBox().y + ACTOR_RECT_HEIGHT;
            const y2 = ACTOR_RECT_HEIGHT + offsetY;

            this.shapesGenerator.drawLine(x, x, y1, y2);

            // Draw cross
            this.shapesGenerator.drawCross(x, y2);
        }
    }
}