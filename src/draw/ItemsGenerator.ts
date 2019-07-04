import { Signal } from "../model/Signal";
import { SignalElement, ActorElement, LineType, ActorRect, SignalType } from "./model";
import Actor from "../model/Actor";
import * as Snap from 'snapsvg';
import { ShapesGenerator, TextOption, LineOption } from "./ShapesGenerator";

const ACTOR_RECT_WIDTH = 100;
const ACTOR_RECT_HEIGHT = 50;

const SIGNAL_SELF_WIDTH = 25;
const SIGNAL_SELF_HEIGHT = 50;
const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

const SIGNAL_TEXT_OFFSET_X = 5;
const SIGNAL_TEXT_OFFSET_Y = 5;

const SIGNAL_CREATION_WIDTH = 100;

/**
 * Generates sequence diagrams items: Actor, Signal, Note, ...
 */
export default class ItemsGenerator {

    shapesGenerator: ShapesGenerator;

    constructor(container: SVGElement) {
        const paper = Snap(container);
        this.shapesGenerator = new ShapesGenerator(paper);
    }
    
    drawSignal(signal: Signal, offsetY: number,
                actorElA: ActorElement, actorElB: ActorElement,
                actorElACreatedBySignal: ActorElement, actorElBCreatedBySignal: ActorElement
    ): SignalElement {

        let signalElement = null;
        const classicActors = actorElA && actorElB;
        const signalToSelf = signal.toSameActor();

        if(signalToSelf) {
            signalElement = this._drawSelfSignal(signal, offsetY, actorElA);
        }
        else if(classicActors) {
            signalElement = this._drawSignalFromAToB(signal, actorElA, actorElB, offsetY);
        } 
        else if(actorElACreatedBySignal && actorElBCreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElACreatedBySignal, actorElBCreatedBySignal, offsetY);
        }
        else if(actorElACreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElACreatedBySignal, actorElB, offsetY);
        }
        else if(actorElBCreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElA, actorElBCreatedBySignal, offsetY);
        }

        return signalElement;
    }

    drawActor(actor: Actor, x: number, y: number): ActorElement {
        // Draw rectangle
        const rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        var textX = (ACTOR_RECT_WIDTH / 2) + x;
        var textY = ACTOR_RECT_HEIGHT / 2;
        const text = this.shapesGenerator.drawText(textX, textY, actor.name, [TextOption.CENTERED]);

        return new ActorElement(actor, new ActorRect(rect, text));
    }

    drawActorLines(actorsElements: ActorElement[], destroyedActors: Actor[], offsetY: number): void {
        for(const i in actorsElements) {
            const actorEl = actorsElements[i];
            const actorName = actorEl.actor.name;

            const alreadyDestroyed = destroyedActors.filter(a => a.name === actorName).pop();

            if(!alreadyDestroyed) {
                const line = this._drawActorLine(actorEl, actorName, offsetY);
                actorEl.line = line;
            }
        }
    }

    _drawActorCreatedBySignal(signal: Signal, x: number, y: number, offsetY: number): ActorElement {
        // Draw rectangle
        const rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (ACTOR_RECT_WIDTH / 2) + x;
        const textY = (ACTOR_RECT_HEIGHT / 2) + y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.actorB.name, [TextOption.CENTERED]);

        return new ActorElement(signal.actorB, new ActorRect(rect, text));
    }

    _drawSignalFromAToB(signal: Signal, actorElA: ActorElement, actorElB: ActorElement, offsetY: number): SignalElement {

        // Draw Signal from actor A to actor B
        const signalAX = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        const signalBX = (actorElB.topRect.rect.getBBox().width / 2) + actorElB.topRect.rect.getBBox().x;
        const signalY = actorElA.topRect.rect.getBBox().h + offsetY;
        const dottedLine = signal.lineType === LineType.RESPONSE;

        const options = [LineOption.END_MARKER];
        if(dottedLine) {
            options.push(LineOption.DOTTED);
        }

        const line = this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);

        const signalGoingForward = (signalAX - signalBX) < 0;

        if(signalGoingForward) {
            // Draw text
            const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
            const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
            const text = this.shapesGenerator.drawText(textX, textY, signal.message);

            return SignalElement.forward(line, signal.lineType, signal.type, text, actorElA, actorElB);
        } else {
            // First, draw the text
            let textX = signalAX - SIGNAL_TEXT_OFFSET_X;
            const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
            let text = this.shapesGenerator.drawText(textX, textY, signal.message);
            
            // Get its width so it can be moved right
            const textWidth = text.getBBox().w;

            // Remove the current text
            text.remove();

            // And create a new one that will be correctly placed
            textX = textX - textWidth;
            text = this.shapesGenerator.drawText(textX, textY, signal.message);

            return SignalElement.forward(line, signal.lineType, signal.type, text, actorElA, actorElB);
        }
    }

    _drawSelfSignal(signal: Signal, offsetY: number, actorElA: ActorElement): SignalElement {

        // Draw self signal (3 lines)
        const x1 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        const x2 = x1 + SIGNAL_SELF_WIDTH;
        const y1 = actorElA.topRect.rect.getBBox().h + offsetY;
        const y2 = y1 + SIGNAL_SELF_HEIGHT;
        
        const line1 = this.shapesGenerator.drawLine(x1, x2, y1, y1);
        const line2 = this.shapesGenerator.drawLine(x2, x2, y1, y2);
        const line3 = this.shapesGenerator.drawLine(x2, x1, y2, y2, [LineOption.END_MARKER]);
        
        const lines = [line1, line2, line3];
        
        // Draw text
        const textX = x1 + SIGNAL_SELF_TEXT_OFFSET_X;
        const textY = y1 + SIGNAL_SELF_TEXT_OFFSET_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        return SignalElement.self(lines, signal.lineType, text, actorElA);
    }

    drawSignalAndActor(signal: Signal, actorElA: ActorElement, offsetY: number) : [SignalElement, ActorElement] {

        // Draw line to Actor rect
        const signalAX = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        const signalBX = signalAX + SIGNAL_CREATION_WIDTH;
        const signalY = actorElA.topRect.rect.getBBox().h + offsetY;

        const options = [LineOption.END_MARKER];
        const line = this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);

        // Draw text
        const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
        const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        // Draw Actor rect
        const rectX = signalBX;
        const rectY = signalY - (ACTOR_RECT_HEIGHT / 2);
        const actorElB = this._drawActorCreatedBySignal(signal, rectX, rectY, offsetY);
        
        const signalEl = SignalElement.forward(line, LineType.REQUEST, SignalType.ACTOR_CREATION, text, actorElA, actorElB);

        return [signalEl, actorElB];
    }

    destroyActor(actorEl: ActorElement, offsetY: number): void {
        // Draw actor line
        const x = actorEl.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const y1 = actorEl.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const y2 = ACTOR_RECT_HEIGHT + offsetY;

        const line = this.shapesGenerator.drawLine(x, x, y1, y2);

        // Draw cross
        const cross =this.shapesGenerator.drawCross(x, y2);
    }

    _drawActorLine(actorElement: ActorElement, actorName: string, offsetY: number): Snap.Element {
        // Draw whole line
        const lineX = actorElement.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const lineY1 = actorElement.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const lineY2 = offsetY + ACTOR_RECT_HEIGHT;
        const line = this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

        // Draw bottom actor rect
        const rectX = lineX - (ACTOR_RECT_WIDTH / 2);
        const rectY = lineY2;
        var rect = this.shapesGenerator.drawRect(rectX, rectY, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        var textX = (ACTOR_RECT_WIDTH / 2) + rectX;
        var textY = (ACTOR_RECT_HEIGHT / 2) + lineY2;
        this.shapesGenerator.drawText(textX, textY, actorName, [TextOption.CENTERED]);

        return line;
    }
}