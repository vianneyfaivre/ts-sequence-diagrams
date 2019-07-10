import { Signal } from "../model/Signal";
import { SignalElement, ActorElement, LineType, ActorRect, SignalType, CrossElement } from "./model";
import Actor from "../model/Actor";
import { ShapesGenerator, TextOption, LineOption } from "./ShapesGenerator";

const ACTOR_RECT_WIDTH = 100;
const ACTOR_RECT_HEIGHT = 50;
export const ACTOR_RECT_MIN_X_PADDING = 5;

const SIGNAL_SELF_WIDTH = 25;
const SIGNAL_SELF_HEIGHT = 50;
const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

const SIGNAL_TEXT_OFFSET_X = 5;
const SIGNAL_TEXT_OFFSET_Y = 5;
export const SIGNAL_X_PADDING = 10;

const SIGNAL_CREATION_WIDTH = 100;

/**
 * Generates sequence diagrams items: Actor, Signal, Note, ...
 */
export default class ItemsGenerator {

    shapesGenerator: ShapesGenerator;

    constructor(container: SVGElement) {
        this.shapesGenerator = new ShapesGenerator(container);
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
                const [line, actorBottomRect] = this._drawLivingActorLineAndRect(actorEl, actorName, offsetY);
                actorEl.line = line;
                actorEl.bottomRect = actorBottomRect;
            }
        }
    }

    shouldResizeActor(actor: ActorElement): boolean {
        const resize = actor.topRect.shouldBeResized();
        if(resize === true) {
            return true;
        }
        return false;
    }

    resizeAndMoveActor(actor: ActorElement): void {

        const rectWidth = actor.topRect.text.getBBox().width + (ACTOR_RECT_MIN_X_PADDING * 2); 
        const lineX = (rectWidth / 2) + actor.topRect.rect.getBBox().x;
        const offsetX = lineX - actor.line.getBBox().x;

        console.log(`Resizing actor rectangles ${actor.actor.name} to ${rectWidth}px and moving line to x=${lineX}`);

        // Resize top rect
        actor.topRect.text.attr({
            "x": lineX
        });
        actor.topRect.rect.attr({
            "width": rectWidth
        });

        // Move life line
        actor.line.attr({
            "x1": lineX,
            "x2": lineX
        });

        // Move cross
        this.updateDestroyedActor(actor);

        // Resize bottom rect
        if(actor.bottomRect) {
            actor.bottomRect.rect.attr({
                "width": rectWidth
            });

            actor.bottomRect.text.attr({
                "x": lineX
            });
        }
    }

    shouldMoveActor(actor: ActorElement, nextActor: ActorElement, defaultDistanceBetweenActors: number): [boolean, number] {
        if(!nextActor) {
            return [false, 0];
        } else {

            const rectDefaultSized = (actor.topRect.rect.getBBox().width === ACTOR_RECT_WIDTH) && (nextActor.topRect.rect.getBBox().width === ACTOR_RECT_WIDTH);
            const actorDefaultDistanced = (nextActor.line.getBBox().x - actor.line.getBBox().x) === defaultDistanceBetweenActors;
            
            if(rectDefaultSized === true && actorDefaultDistanced === true) {
                return [false, 0];
            }

            const defaultDistanceBetweenRect = defaultDistanceBetweenActors - ACTOR_RECT_WIDTH;

            const actorRightX = actor.topRect.rect.getBBox().x + actor.topRect.rect.getBBox().width;
            const nextActorLeftX = nextActor.topRect.rect.getBBox().x;

            const distance = nextActorLeftX - actorRightX;

            if(distance === 0) {
                return [false, 0];
            } 
            else if(distance === defaultDistanceBetweenRect) {
                return [false, 0];
            }
            else if(distance < 0) {
                const nextActorNewLeftX = actorRightX + defaultDistanceBetweenRect;
                const offsetX = nextActorNewLeftX - nextActorLeftX;
                
                console.log(`Actor ${nextActor.actor.name} is behind ${actor.actor.name}, so it should be moved to x=${nextActorNewLeftX} (offset ${offsetX}px to the right)`);
                return [true, offsetX];
            } else {
                const rectAWidth = actor.topRect.rect.getBBox().width;
                const rectBWidth = nextActor.topRect.rect.getBBox().width; 
                const rectAX = actor.topRect.rect.getBBox().x;
                const rectBX = nextActor.topRect.rect.getBBox().x;

                const distAB = (rectBX + rectBWidth/2) - (rectAX + rectAWidth/2);
                const offsetX = distAB - rectAWidth/2 - rectBWidth/2;

                console.log(`Distance between ${actor.actor.name} and ${nextActor.actor.name} is ${distance}px, ${nextActor.actor.name} should be moved ${offsetX}px to the right`);
                return [true, offsetX];
            }
        }
    }

    moveActor(actorAfter: ActorElement, offsetX: number): void {
        console.log(`Moving actor '${actorAfter.actor.name}' ${offsetX}px to the right`);

        // Move actor
        const elementsToMove = [
            actorAfter.topRect.rect,
            actorAfter.topRect.text,
            actorAfter.line
        ];

        if(actorAfter.bottomRect) {
            elementsToMove.push(actorAfter.bottomRect.rect);
            elementsToMove.push(actorAfter.bottomRect.text);
        }

        // if(actorAfter.cross) {
        //     elementsToMove.push(actorAfter.cross.line1);
        //     elementsToMove.push(actorAfter.cross.line2);
        // }

        this.shapesGenerator.translateElements(elementsToMove, offsetX);

        // this.updateDestroyedActor(actorAfter);
    }

    // closeActor = could be on the right or on the left
    isSignalTextTooLong(signal: SignalElement, closeActor: ActorElement): [boolean, number] {

        if(!closeActor) {
            return [false, 0];
        }

        if(signal.signalType === SignalType.SIMPLE) {
            
            // Check if the text overlaps the next actor life line
            if(signal.lineType === LineType.REQUEST) {
                const nextActorLineX = closeActor.line.getBBox().x;
                const signalTextX1 = signal.text.getBBox().x;
                const signalTextX2 = signalTextX1 + signal.text.getBBox().width;
    
                const overlaps = (signalTextX1 < nextActorLineX) && (nextActorLineX < signalTextX2);
    
                if(overlaps === true) {
                    const offsetX = signalTextX2 - nextActorLineX + SIGNAL_X_PADDING;
                    console.log(`Signal text is too long, it overlaps on actor '${closeActor.actor.name}', this actor should be moved ${offsetX}px to the right. Text=${signal.text.innerSVG()}`);
                    return [true, offsetX];
                } 
            }
            // Check if the text overlaps the current actor life line
            else if(signal.lineType === LineType.RESPONSE) {
                const currentActorLineX = signal.actorB.line.getBBox().x;
                const signalTextX1 = signal.text.getBBox().x;
                const signalTextX2 = signalTextX1 + signal.text.getBBox().width;

                const oldSignalLength = signal.actorA.line.getBBox().x - signal.actorB.line.getBBox().x;
                const newSignalLength = signalTextX2 - signalTextX1;

                const overlaps = (signalTextX1 < currentActorLineX) && (currentActorLineX < signalTextX2);
    
                if(overlaps === true) {
                    const offsetX = newSignalLength - oldSignalLength + SIGNAL_X_PADDING;
                    console.log(`Signal text is too long, it overlaps on actor '${signal.actorB.actor.name}', this actor should be moved ${offsetX}px to the right. Text=${signal.text.innerSVG()}`);
                    return [true, offsetX];
                } 
            }
        } 
        // Check if the text overlaps the next actor top rect
        else if(signal.signalType === SignalType.ACTOR_CREATION) {
            const nextActorTopRectX = closeActor.topRect.rect.getBBox().x;
            const signalTextX1 = signal.text.getBBox().x;
            const signalTextX2 = signalTextX1 + signal.text.getBBox().width;

            const overlaps = (signalTextX1 < nextActorTopRectX) && (nextActorTopRectX < signalTextX2);

            if(overlaps === true) {
                const offsetX = signalTextX2 - nextActorTopRectX + SIGNAL_X_PADDING;
                console.log(`Signal text is too long, it overlaps on actor '${closeActor.actor.name}' top rectangle, this actor should be moved ${offsetX}px to the right. Text=${signal.text.innerSVG()}`);
                return [true, offsetX];
            } 
        } 

        return [false, 0];
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

        // Determine whether the signal goes backward of forward
        let signalGoingForward;

        // Based on that, compute the line x1 and x2 to always have x1 < x2 (thus every line will start from the left and go to the right)
        let lineX1;
        let lineX2;
        if(actorElA.topRect.rect.getBBox().x < actorElB.topRect.rect.getBBox().x) {
            signalGoingForward = true;
            lineX1 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
            lineX2 = (actorElB.topRect.rect.getBBox().width / 2) + actorElB.topRect.rect.getBBox().x;
        } else {
            signalGoingForward = false;
            lineX1 = (actorElB.topRect.rect.getBBox().width / 2) + actorElB.topRect.rect.getBBox().x;
            lineX2 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        }

        // Draw Signal line
        const lineY = actorElA.topRect.rect.getBBox().h + offsetY;
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

        if(signalGoingForward) {
            // Draw Signal text
            const textX = lineX1 + SIGNAL_TEXT_OFFSET_X;
            const textY = lineY - SIGNAL_TEXT_OFFSET_Y;
            const text = this.shapesGenerator.drawText(textX, textY, signal.message);

            return SignalElement.forward(line, signal.lineType, signal.type, text, actorElA, actorElB);
        } else {
            // First, draw the text
            let textX = lineX2 - SIGNAL_TEXT_OFFSET_X;
            const textY = lineY - SIGNAL_TEXT_OFFSET_Y;
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

    destroyActor(actorEl: ActorElement, offsetY: number): [Snap.Element, CrossElement] {
        // Draw actor line
        const x = actorEl.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const y1 = actorEl.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const y2 = ACTOR_RECT_HEIGHT + offsetY;

        const line = this.shapesGenerator.drawLine(x, x, y1, y2);

        // Draw cross
        const cross = this.shapesGenerator.drawCross(x, y2);

        return [line, cross];
    }

    _drawLivingActorLineAndRect(actorElement: ActorElement, actorName: string, offsetY: number): [Snap.Element, ActorRect] {
        // Draw whole line
        const lineX = actorElement.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const lineY1 = actorElement.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const lineY2 = offsetY + ACTOR_RECT_HEIGHT;
        const line = this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

        // Draw bottom actor rect
        const rectX = lineX - (ACTOR_RECT_WIDTH / 2);
        const rectY = lineY2;
        const rect = this.shapesGenerator.drawRect(rectX, rectY, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (ACTOR_RECT_WIDTH / 2) + rectX;
        const textY = (ACTOR_RECT_HEIGHT / 2) + lineY2;
        const text = this.shapesGenerator.drawText(textX, textY, actorName, [TextOption.CENTERED]);

        return [line, new ActorRect(rect, text)];
    }

    updateDestroyedActor(actor: ActorElement): void {
        if(actor.cross && actor.destroyed === true) {
                
            const lifeLineX = actor.line.getBBox().x;
            
            const oldLineX1 = actor.cross.line1.getBBox().x;
            const oldLineX2 = actor.cross.line1.getBBox().x2;

            const crossWidth = actor.cross.line1.getBBox().width;
            
            const newLineX1 = lifeLineX - (crossWidth / 2);
            const newLineX2 = lifeLineX + (crossWidth / 2);

            const shouldBeAdjusted = (oldLineX1 != newLineX1) && (oldLineX2 < newLineX2);
            
            if(shouldBeAdjusted === true) {

                actor.cross.line1.attr({
                    x1: newLineX1,
                    x2: newLineX2
                });

                actor.cross.line2.attr({
                    x1: newLineX1,
                    x2: newLineX2
                });
            }
        }
    }

    adjustActorSignals(actor: ActorElement): void {
        const allSignals = [
            ...actor.incomingSignals,
            ...actor.outgoingSignals,
            ...actor.selfSignals
        ];

        // Redraw signals start and end
        for(const j in allSignals) {
            const signal = allSignals[j];

            if(signal.signalType === SignalType.SIMPLE) {

                if(signal.toSameActor() === true) {
                    const line1 = signal.lines[0];
                    const line2 = signal.lines[1];
                    const line3 = signal.lines[2];
                    
                    const shouldBeAdjusted = (signal.actorA.line.getBBox().x !== line1.getBBox().x) 
                        || (signal.actorA.line.getBBox().x !== line3.getBBox().x2);
    
                    if(shouldBeAdjusted === true) {
                        console.log(`Adjusting '${signal.actorA.actor.name}' self signal : ${signal.text.innerSVG()}`);
                        const line1Width = line1.getBBox().width;

                        line1.attr({
                            "x1": signal.actorA.line.getBBox().x,
                            "x2": signal.actorA.line.getBBox().x + line1Width
                        });

                        line2.attr({
                            "x1": signal.actorA.line.getBBox().x + line1Width,
                            "x2": signal.actorA.line.getBBox().x + line1Width
                        });

                        line3.attr({
                            "x1": signal.actorA.line.getBBox().x + line1Width,
                            "x2": signal.actorA.line.getBBox().x
                        });
    
                        signal.text.attr({
                            "x": signal.actorA.line.getBBox().x + line1Width + SIGNAL_X_PADDING
                        });
                    }
                }
                else if(signal.lineType === LineType.REQUEST) {

                    const shouldBeAdjusted = (signal.actorA.line.getBBox().x !== signal.line.getBBox().x) 
                                            || (signal.actorB.line.getBBox().x !== signal.line.getBBox().x2);

                    if(shouldBeAdjusted === true) {
                        // console.log(`Adjusting request signal from '${signal.actorA.actor.name}' to '${signal.actorB.actor.name}' : ${signal.text.innerSVG()}`);
    
                        signal.line.attr({
                            "x1": signal.actorA.line.getBBox().x,
                            "x2": signal.actorB.line.getBBox().x
                        });
    
                        signal.text.attr({
                            "x": ACTOR_RECT_MIN_X_PADDING + signal.actorA.line.getBBox().x
                        });
                    }
                } 
                else if(signal.lineType === LineType.RESPONSE){
                    const shouldBeAdjusted = (signal.actorB.line.getBBox().x !== signal.line.getBBox().x) 
                                             || (signal.actorA.line.getBBox().x !== signal.line.getBBox().x2) 

                    if(shouldBeAdjusted === true) {
                        // console.log(`Adjusting response signal from '${signal.actorA.actor.name}' to '${signal.actorB.actor.name}' : ${signal.text.innerSVG()}`);
    
                        signal.line.attr({
                            "x1": signal.actorB.line.getBBox().x,
                            "x2": signal.actorA.line.getBBox().x
                        });
    
                        const textX = signal.line.getBBox().x2 - signal.text.getBBox().width - ACTOR_RECT_MIN_X_PADDING;
    
                        signal.text.attr({
                            "x": textX
                        });
                    }
                }
            } 
            else if (signal.signalType === SignalType.ACTOR_CREATION) {

                const shouldBeAdjusted = (signal.actorA.line.getBBox().x !== signal.line.getBBox().x) 
                                      || (signal.actorB.topRect.rect.getBBox().x !== signal.line.getBBox().x2) 

                if(shouldBeAdjusted === true) {
                    // console.log(`Adjusting creation signal from '${signal.actorA.actor.name}' to '${signal.actorB.actor.name}' : ${signal.text.innerSVG()}`);

                    signal.line.attr({
                        "x1": signal.actorA.line.getBBox().x,
                        "x2": signal.actorB.topRect.rect.getBBox().x
                    });
    
                    signal.text.attr({
                        "x": ACTOR_RECT_MIN_X_PADDING + signal.actorA.line.getBBox().x
                    });
                }
                
            }
        }
    }
}