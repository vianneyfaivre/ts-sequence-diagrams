import { ActorElement, ActorRect, CrossElement, LineType, SignalElement, SignalType, Dimensions, TextOption, LineOption, TitleElement } from "../dao/draw/model";
import { ShapesGenerator } from "../dao/draw/ShapesGenerator";
import { Actor, Signal } from "../dao/parser/model";
import {Element, Line} from "@svgdotjs/svg.js";

/**
 * Generates sequence diagrams items: Actor, Signal, Note, ...
 */
export default class ItemsGenerator {

    signalCount: number;

    constructor(readonly shapesGenerator: ShapesGenerator) {
        this.signalCount = 0;
    }

    drawTitle(x: string, y: number, title: string): TitleElement {
        const text = this.shapesGenerator.drawText(x, y, title, [TextOption.CENTERED, TextOption.TITLE]);
        return new TitleElement(text);
    }
    
    drawSignal(signal: Signal, offsetY: number,
                actorElA: ActorElement, actorElB: ActorElement,
                actorElACreatedBySignal: ActorElement, actorElBCreatedBySignal: ActorElement
    ): SignalElement {

        let signalElement = null;
        const classicActors = actorElA && actorElB;
        const signalToSelf = signal.toSameActor();

        if(signalToSelf) {
            if(!actorElA) {
                signalElement = this._drawSelfSignal(signal, offsetY, actorElACreatedBySignal);
            } else {
                signalElement = this._drawSelfSignal(signal, offsetY, actorElA);
            }
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
        const rect = this.shapesGenerator.drawRect(x, y, Dimensions.ACTOR_RECT_WIDTH, Dimensions.ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        var textX = (Dimensions.ACTOR_RECT_WIDTH / 2) + x;
        var textY = Dimensions.ACTOR_RECT_HEIGHT / 2 + y;
        const text = this.shapesGenerator.drawText(textX, textY, actor.name, [TextOption.CENTERED]);

        return new ActorElement(actor, new ActorRect(rect, text));
    }

    drawActorLines(actorsElements: ActorElement[], destroyedActors: Actor[], offsetY: number): void {
        for(const i in actorsElements) {
            const actorEl = actorsElements[i];
            const actorName = actorEl.actor.name;

            const alreadyDestroyed = destroyedActors.filter(a => a.name === actorName).pop();

            if(!alreadyDestroyed) {
                const [line, actorBottomRect] = this._drawLivingActorLineAndRect(actorEl, actorName, offsetY);
                actorEl.line = line;
                actorEl.bottomRect = actorBottomRect;
            }
        }
    }

    _drawActorCreatedBySignal(signal: Signal, x: number, y: number, offsetY: number): ActorElement {
        // Draw rectangle
        const rect = this.shapesGenerator.drawRect(x, y, Dimensions.ACTOR_RECT_WIDTH, Dimensions.ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (Dimensions.ACTOR_RECT_WIDTH / 2) + x;
        const textY = (Dimensions.ACTOR_RECT_HEIGHT / 2) + y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.actorB.name, [TextOption.CENTERED]);

        return new ActorElement(signal.actorB, new ActorRect(rect, text));
    }

    _drawSignalFromAToB(signal: Signal, actorElA: ActorElement, actorElB: ActorElement, offsetY: number): SignalElement {

        // Determine whether the signal goes backward of forward
        let signalGoingForward;

        // Based on that, compute the line x1 and x2 to always have x1 < x2 (thus every line will start from the left and go to the right)
        let lineX1;
        let lineX2;
        if(actorElA.topRect.rect.bbox().x < actorElB.topRect.rect.bbox().x) {
            signalGoingForward = true;
            lineX1 = (actorElA.topRect.rect.bbox().width / 2) + actorElA.topRect.rect.bbox().x;
            lineX2 = (actorElB.topRect.rect.bbox().width / 2) + actorElB.topRect.rect.bbox().x;
        } else {
            signalGoingForward = false;
            lineX1 = (actorElB.topRect.rect.bbox().width / 2) + actorElB.topRect.rect.bbox().x;
            lineX2 = (actorElA.topRect.rect.bbox().width / 2) + actorElA.topRect.rect.bbox().x;
        }

        // Draw Signal line
        const lineY = actorElA.topRect.rect.bbox().h + offsetY;
        const dottedLine = signal.lineType === LineType.RESPONSE;

        const options = [];
        
        if(signalGoingForward) {
            options.push(LineOption.END_MARKER);
        } else {
            options.push(LineOption.START_MARKER);
        }

        if(dottedLine) {
            options.push(LineOption.DOTTED);
        }

        const line = this.shapesGenerator.drawLine(lineX1, lineX2, lineY, lineY, options);

        // Draw Signal text
        const textX = lineX1 + Dimensions.SIGNAL_TEXT_PADDING_X;
        const textY = lineY - Dimensions.SIGNAL_TEXT_PADDING_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        return SignalElement.forward(this.signalCount++, line, signal.lineType, signal.type, text, actorElA, actorElB);
    }

    _drawSelfSignal(signal: Signal, offsetY: number, actorElA: ActorElement): SignalElement {

        // Draw self signal (3 lines)
        const x1 = (actorElA.topRect.rect.bbox().width / 2) + actorElA.topRect.rect.bbox().x;
        const x2 = x1 + Dimensions.SIGNAL_SELF_WIDTH;
        const y1 = actorElA.topRect.rect.bbox().h + offsetY;
        const y2 = y1 + Dimensions.SIGNAL_SELF_HEIGHT;
        
        const line1 = this.shapesGenerator.drawLine(x1, x2, y1, y1);
        const line2 = this.shapesGenerator.drawLine(x2, x2, y1, y2);
        const line3 = this.shapesGenerator.drawLine(x2, x1, y2, y2, [LineOption.END_MARKER]);
        
        const lines = [line1, line2, line3];
        
        // Draw text
        const textX = x1 + Dimensions.SIGNAL_SELF_WIDTH + Dimensions.SIGNAL_TEXT_PADDING_X;
        const textY = y1 + Dimensions.SIGNAL_SELF_TEXT_PADDING_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        return SignalElement.self(this.signalCount++, lines, signal.lineType, text, actorElA);
    }

    drawSignalAndActor(signal: Signal, actorElA: ActorElement, offsetY: number) : [SignalElement, ActorElement] {

        // Draw line to Actor rect
        const signalAX = (actorElA.topRect.rect.bbox().width / 2) + actorElA.topRect.rect.bbox().x;
        const signalBX = signalAX + Dimensions.SIGNAL_CREATION_WIDTH;
        const signalY = actorElA.topRect.rect.bbox().h + offsetY;

        const options = [LineOption.END_MARKER];
        const line = this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);

        // Draw text
        const textX = signalAX + Dimensions.SIGNAL_TEXT_PADDING_X;
        const textY = signalY - Dimensions.SIGNAL_TEXT_PADDING_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        // Draw Actor rect
        const rectX = signalBX;
        const rectY = signalY - (Dimensions.ACTOR_RECT_HEIGHT / 2);
        const actorElB = this._drawActorCreatedBySignal(signal, rectX, rectY, offsetY);
        
        const signalEl = SignalElement.forward(this.signalCount++, line, LineType.REQUEST, SignalType.ACTOR_CREATION, text, actorElA, actorElB);

        return [signalEl, actorElB];
    }

    destroyActor(actorEl: ActorElement, offsetY: number): [Line, CrossElement] {
        // Draw actor line
        const x = actorEl.topRect.rect.bbox().x + (Dimensions.ACTOR_RECT_WIDTH / 2);
        const y1 = actorEl.topRect.rect.bbox().y + Dimensions.ACTOR_RECT_HEIGHT;
        const y2 = Dimensions.ACTOR_RECT_HEIGHT + offsetY;

        const line = this.shapesGenerator.drawLine(x, x, y1, y2);

        // Draw cross
        const cross = this.shapesGenerator.drawCross(x, y2);

        return [line, cross];
    }

    _drawLivingActorLineAndRect(actorElement: ActorElement, actorName: string, offsetY: number): [Line, ActorRect] {
        // Draw whole line
        const lineX = actorElement.topRect.rect.bbox().x + (Dimensions.ACTOR_RECT_WIDTH / 2);
        const lineY1 = actorElement.topRect.rect.bbox().y + Dimensions.ACTOR_RECT_HEIGHT;
        const lineY2 = offsetY + Dimensions.ACTOR_RECT_HEIGHT;
        const line = this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

        // Draw bottom actor rect
        const rectX = lineX - (Dimensions.ACTOR_RECT_WIDTH / 2);
        const rectY = lineY2;
        const rect = this.shapesGenerator.drawRect(rectX, rectY, Dimensions.ACTOR_RECT_WIDTH, Dimensions.ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (Dimensions.ACTOR_RECT_WIDTH / 2) + rectX;
        const textY = (Dimensions.ACTOR_RECT_HEIGHT / 2) + lineY2;
        const text = this.shapesGenerator.drawText(textX, textY, actorName, [TextOption.CENTERED]);

        return [line, new ActorRect(rect, text)];
    }
}