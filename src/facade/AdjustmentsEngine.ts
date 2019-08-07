import { LineType, SignalType, Dimensions, ActorElement, SignalElement, TitleElement, BlockStackElement } from "../dao/draw/model";
import { ShapesGenerator } from "../dao/draw/ShapesGenerator";
import {Element} from "@svgdotjs/svg.js";

/**
 * Adjusts the positions of the items once drawn
 */
export default class AdjustmentsEngine {

    constructor(
        readonly container: HTMLElement,
        readonly shapesGenerator: ShapesGenerator) {
    }

    resizeSvg(): void {

        let svgWidth = 0;
        let svgHeight = 0;

        this.getAllElements().forEach(el => {

            const x1 = el.bbox().x;
            const width = el.bbox().width;
            const x2 = x1 + width;

            const y1 = el.bbox().y;
            const height = el.bbox().height;
            const y2 = y1 + height;

            if(x2 > svgWidth) {
                svgWidth = x2;
            }

            if(y2 > svgHeight) {
                svgHeight = y2;
            }
            
        });

        // Size parent <div>
        this.container.style.width = `${svgWidth + Dimensions.SVG_PADDING}px`;
        this.container.style.height = `${svgHeight + Dimensions.SVG_PADDING}px`;

        // Size <svg>
        const svg: SVGElement = this.container.getElementsByTagName("svg")[0];
        if(svg) {
            svg.style.width = `${svgWidth + Dimensions.SVG_PADDING}px`;
            svg.style.height = `${svgHeight + Dimensions.SVG_PADDING}px`;
        }
    }

    /**
     * For each signal, check if any of the signal (line or text) is overlapped by any of the block which has been already drawn
     */
    adjustSignalsOverlappedByBlocks(signals: SignalElement[], blocksStacks: BlockStackElement[], actors: ActorElement[]): void {
        
        for(const blockStack of blocksStacks) {
            
            // Get the first signal in the block stack
            const blockFirstSignal = blockStack.firstSignal();
            
            // TODO Get the signal just before the first signal in the block stack

            // Get the last signal in the block stack
            const blockLastSignal = blockStack.lastSignal();
            
            // Get the signal just after the last signal in the block stack
            const nextLastSignal = signals.filter(s => s.id === blockLastSignal.id+1)[0];

            if(blockLastSignal && nextLastSignal) {
                const blockRectY2 = blockStack.blocks[0].blockRect.bbox().y2;
                const [nextSignalY1, nextSignalY2] = nextLastSignal.getY();
                const overlaps = blockRectY2 >= nextSignalY1;

                // if signal is being overlapped, move all the next signals
                if(overlaps === true) {
                    const offsetY = (blockRectY2 - nextSignalY2) + Dimensions.DISTANCE_BETWEEN_SIGNALS;
                    this._moveEverythingBelowSignal(nextLastSignal, offsetY, signals, blocksStacks, actors);
                }

            }
        }
    }

    private _moveEverythingBelowSignal(signal: SignalElement, offsetY: number, signals: SignalElement[], blocksStacks: BlockStackElement[], actors: ActorElement[]): void {
        
        console.log(`Moving all elements below signal ${signal.toString()} ${offsetY}px down`);
        const [nextSignalY1, nextSignalY2] = signal.getY();

        // Get all elements under the signal and extend/move them
        signals
         .filter(signal => signal.getLineY()[0] >= nextSignalY2)
         .forEach(signal => {

            // Move signal down
            this.translateElementsY(signal.svgElements(), offsetY);

            // Move all actors down
            actors.forEach(actor => {
                
                // Extend line
                actor.line.attr({y2: actor.line.bbox().y2 + offsetY});
                
                // Move actor bottom rectangle
                if(actor.bottomRect) {
                    this.translateElementsY(actor.bottomRect.svgElements(), offsetY);
                }

                // Move destroyed actor
                if(actor.cross) {
                    this.translateElementsY(actor.cross.svgElements(), offsetY);
                }
            });
          });

    // Move blocks down
    blocksStacks
        .filter(block => block.blocks[0] && block.blocks[0].blockRect.bbox().y >= nextSignalY2)
        .forEach(block => {
            this.translateElementsY(block.svgElements(), offsetY);
        }); 
    }

    adjustActorsAndSignals(actors: ActorElement[]): void {

        // b. Adjust actor top/bottom rectangles
        console.log("* RESIZING ACTOR RECTANGLES *");
        for (const i in actors) {
            const actorEl = actors[i];

            const actorToResize = this._shouldResizeActor(actorEl);
            if(actorToResize === true) {
                this._resizeAndMoveActor(actorEl);
            }
        }

        // c. Adjust space between actors
        console.log("* ADJUSTING SPACE BETWEEN ACTORS *");
        for (const i in actors) {
            const actorEl = actors[i];
            const closestActor = actors[+i+1];

            const [shouldMove, offsetX] = this._shouldMoveActor(actorEl, closestActor, Dimensions.DISTANCE_BETWEEN_ACTORS);
            if(shouldMove === true) {
                
                // Move the closest actor
                this._moveActor(closestActor, offsetX);
            }
        }

        // d. Adjust signals
        console.log(`* ADJUSTING SIGNALS *`);
        for (const i in actors) {

            const actorEl = actors[i];
            const nextActors = actors.slice(+i);

            this._adjustSignals(actorEl, nextActors);
            this._updateDestroyedActor(actorEl);
        }
    }

    private _adjustSignals(actor: ActorElement, nextActors: ActorElement[]) {
        const actorSignals = [
            ...actor.selfSignals,
            ...actor.incomingSignals,
            ...actor.outgoingSignals
        ];

        const nextActor = nextActors[0];

        for(const j in actorSignals) {
            const signal = actorSignals[j];
            
            if(nextActor){
                // Move next actor if any of the current actor signals is too long
                const [shouldMove, offsetX] = this._isSignalTextTooLong(signal, nextActor);
                if(shouldMove === true) {
                    nextActors.forEach(a => {
                        console.log(`Moving actor '${a.actor.name}' because of actor '${nextActor.actor.name}' ${offsetX}px to the right`)
                        this._moveActor(a, offsetX);
                    });
                }
            }

            this._adjustActorSignals(actor);
        }
    }

    private _shouldResizeActor(actor: ActorElement): boolean {
        const resize = actor.topRect.shouldBeResized();
        if(resize === true) {
            return true;
        }
        return false;
    }

    private _isSignalTextTooLong(signal: SignalElement, closeActor: ActorElement): [boolean, number] {
        // closeActor = could be on the right or on the left

        if(!closeActor) {
            return [false, 0];
        }

        if(signal.signalType === SignalType.SIMPLE) {
            
            // Check if the text overlaps the next actor life line
            if(signal.lineType === LineType.REQUEST) {
                const nextActorLineX = closeActor.line.bbox().x;
                const signalTextX1 = signal.text.bbox().x;
                const signalTextX2 = signalTextX1 + signal.text.bbox().width;
    
                const overlaps = (signalTextX1 < nextActorLineX) && (nextActorLineX < signalTextX2);
    
                if(overlaps === true) {
                    const offsetX = signalTextX2 - nextActorLineX + Dimensions.SIGNAL_OVERLAPPING_ACTOR_X_OFFSET;
                    console.log(`Signal text is too long, it overlaps on actor '${closeActor.actor.name}', this actor should be moved ${offsetX}px to the right. Text=${signal.text.text()}`);
                    return [true, offsetX];
                } 
            }
            // Check if the text overlaps the current actor life line
            else if(signal.lineType === LineType.RESPONSE) {
                const currentActorLineX = signal.actorB.line.bbox().x;
                const signalTextX1 = signal.text.bbox().x;
                const signalTextX2 = signalTextX1 + signal.text.bbox().width;

                const oldSignalLength = signal.actorA.line.bbox().x - signal.actorB.line.bbox().x;
                const newSignalLength = signalTextX2 - signalTextX1;

                const overlaps = (signalTextX1 < currentActorLineX) && (currentActorLineX < signalTextX2);
    
                if(overlaps === true) {
                    const offsetX = newSignalLength - oldSignalLength + Dimensions.SIGNAL_OVERLAPPING_ACTOR_X_OFFSET;
                    console.log(`Signal text is too long, it overlaps on actor '${signal.actorB.actor.name}', this actor should be moved ${offsetX}px to the right. Text=${signal.text.text()}`);
                    return [true, offsetX];
                } 
            }
        } 
        // Check if the text overlaps the next actor top rect
        else if(signal.signalType === SignalType.ACTOR_CREATION) {
            const nextActorTopRectX = closeActor.topRect.rect.bbox().x;
            const actorBTopRectX = signal.actorB.topRect.rect.bbox().x;
            const signalTextX1 = signal.text.bbox().x;
            const signalTextX2 = signalTextX1 + signal.text.bbox().width;

            const overlapsNextActor = (signalTextX1 < nextActorTopRectX) && (nextActorTopRectX < signalTextX2);
            const overlapsActorB = (signalTextX1 < actorBTopRectX) && (actorBTopRectX < signalTextX2);

            if(overlapsNextActor === true) {
                const offsetX = signalTextX2 - nextActorTopRectX + Dimensions.SIGNAL_OVERLAPPING_ACTOR_X_OFFSET;
                console.log(`Creation signal text is too long, it overlaps on next actor '${closeActor.actor.name}' top rectangle, this actor should be moved ${offsetX}px to the right. Text=${signal.text.text()}`);
                return [true, offsetX];
            } 
            if(overlapsActorB === true) {
                const offsetX = signalTextX2 - actorBTopRectX + Dimensions.SIGNAL_OVERLAPPING_ACTOR_X_OFFSET;
                console.log(`Creation signal text is too long, it overlaps on actor B '${signal.actorB.actor.name}' top rectangle, this actor should be moved ${offsetX}px to the right. Text=${signal.text.text()}`);
                return [true, offsetX];
            }
        } 

        return [false, 0];
    }

    private _updateDestroyedActor(actor: ActorElement): void {
        if(actor.cross && actor.destroyed === true) {
                
            const lifeLineX = actor.line.bbox().x;
            
            const oldLineX1 = actor.cross.line1.bbox().x;
            const oldLineX2 = actor.cross.line1.bbox().x2;

            const crossWidth = actor.cross.line1.bbox().width;
            
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

    private _adjustActorSignals(actor: ActorElement): void {
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
                    
                    const shouldBeAdjusted = (signal.actorA.line.bbox().x !== line1.bbox().x) 
                        || (signal.actorA.line.bbox().x !== line3.bbox().x2);
    
                    if(shouldBeAdjusted === true) {
                        console.log(`Adjusting '${signal.actorA.actor.name}' self signal : ${signal.text.text()}`);
                        const line1Width = line1.bbox().width;

                        line1.attr({
                            "x1": signal.actorA.line.bbox().x,
                            "x2": signal.actorA.line.bbox().x + line1Width
                        });

                        line2.attr({
                            "x1": signal.actorA.line.bbox().x + line1Width,
                            "x2": signal.actorA.line.bbox().x + line1Width
                        });

                        line3.attr({
                            "x1": signal.actorA.line.bbox().x + line1Width,
                            "x2": signal.actorA.line.bbox().x
                        });
    
                        signal.text.attr({
                            "x": signal.actorA.line.bbox().x + line1Width + Dimensions.SIGNAL_OVERLAPPING_ACTOR_X_OFFSET
                        });
                    }
                }
                else if(signal.lineType === LineType.REQUEST) {
    
                    const lineX1 = signal.actorA.line.bbox().x;
                    const lineX2 = signal.actorB.line.bbox().x;

                    console.debug(`Signal Request ${signal.actorA.actor.name}-${signal.actorB.actor.name}: x1=${lineX1} x2=${lineX2}`);

                    if(lineX1 < lineX2) {
                        signal.line.attr({
                            "x1": lineX1,
                            "x2": lineX2
                        });

                        signal.text.attr({
                            "x": Dimensions.ACTOR_RECT_MIN_X_PADDING + lineX1
                        });
                    } else {
                        signal.line.attr({
                            "x1": lineX2,
                            "x2": lineX1
                        });
                        
                        const textX = lineX1 - Dimensions.SIGNAL_TEXT_PADDING_X - signal.text.bbox().w;

                        signal.text.attr({
                            "x": textX
                        });
                    }
                } 
                else if(signal.lineType === LineType.RESPONSE){
                    const lineX1 = signal.actorA.line.bbox().x;
                    const lineX2 = signal.actorB.line.bbox().x;

                    console.debug(`Signal Response ${signal.actorA.actor.name}-${signal.actorB.actor.name}: x1=${lineX1} x2=${lineX2}`);

                    if(lineX1 < lineX2) {
                        signal.line.attr({
                            "x1": lineX1,
                            "x2": lineX2
                        });

                        const textX = Dimensions.SIGNAL_TEXT_PADDING_X + signal.actorA.line.bbox().x;
                        signal.text.attr({
                            "x": textX
                        });
                    } else {
                        signal.line.attr({
                            "x1": lineX2,
                            "x2": lineX1
                        });

                        const textX = lineX1 - signal.text.bbox().width - Dimensions.SIGNAL_TEXT_PADDING_X;
                        signal.text.attr({
                            "x": textX
                        });
                    }
                }
            } 
            else if (signal.signalType === SignalType.ACTOR_CREATION) {

                const shouldBeAdjusted = (signal.actorA.line.bbox().x !== signal.line.bbox().x) 
                                      || (signal.actorB.topRect.rect.bbox().x !== signal.line.bbox().x2) 

                if(shouldBeAdjusted === true) {
                    // console.log(`Adjusting creation signal from '${signal.actorA.actor.name}' to '${signal.actorB.actor.name}' : ${signal.text.toString()}`);

                    signal.line.attr({
                        "x1": signal.actorA.line.bbox().x,
                        "x2": signal.actorB.topRect.rect.bbox().x
                    });
    
                    signal.text.attr({
                        "x": Dimensions.ACTOR_RECT_MIN_X_PADDING + signal.actorA.line.bbox().x
                    });
                }
                
            }
        }
    }

    private _resizeAndMoveActor(actor: ActorElement): void {

        const rectWidth = actor.topRect.text.bbox().width + (Dimensions.ACTOR_RECT_MIN_X_PADDING * 2); 
        const lineX = (rectWidth / 2) + actor.topRect.rect.bbox().x;

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
        this._updateDestroyedActor(actor);

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

    private _shouldMoveActor(actor: ActorElement, nextActor: ActorElement, defaultDistanceBetweenActors: number): [boolean, number] {
        if(!nextActor) {
            return [false, 0];
        } else {

            const rectDefaultSized = (actor.topRect.rect.bbox().width === Dimensions.ACTOR_RECT_WIDTH) && (nextActor.topRect.rect.bbox().width === Dimensions.ACTOR_RECT_WIDTH);
            const actorDefaultDistanced = (nextActor.line.bbox().x - actor.line.bbox().x) === defaultDistanceBetweenActors;
            
            if(rectDefaultSized === true && actorDefaultDistanced === true) {
                return [false, 0];
            }

            const defaultDistanceBetweenRect = defaultDistanceBetweenActors - Dimensions.ACTOR_RECT_WIDTH;

            const actorRightX = actor.topRect.rect.bbox().x + actor.topRect.rect.bbox().width;
            const nextActorLeftX = nextActor.topRect.rect.bbox().x;

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
                const rectAWidth = actor.topRect.rect.bbox().width;
                const rectBWidth = nextActor.topRect.rect.bbox().width; 
                const rectAX = actor.topRect.rect.bbox().x;
                const rectBX = nextActor.topRect.rect.bbox().x;

                const distAB = (rectBX + rectBWidth/2) - (rectAX + rectAWidth/2);
                const offsetX = distAB - rectAWidth/2 - rectBWidth/2;

                console.log(`Distance between ${actor.actor.name} and ${nextActor.actor.name} is ${distance}px, ${nextActor.actor.name} should be moved ${offsetX}px to the right`);
                return [true, offsetX];
            }
        }
    }

    private _moveActor(actorAfter: ActorElement, offsetX: number): void {
        console.log(`Moving actor '${actorAfter.actor.name}' ${offsetX}px to the right`);

        // Move actor
        const elementsToMove: Element[] = [
            actorAfter.topRect.rect,
            actorAfter.topRect.text,
            actorAfter.line
        ]; 

        if(actorAfter.bottomRect) {
            elementsToMove.push(actorAfter.bottomRect.rect);
            elementsToMove.push(actorAfter.bottomRect.text);
        }

        this.translateElementsX(elementsToMove, offsetX);
    }
    
    private translateElementsX(elements: Element[], offsetX: number): void {
        elements
            .filter(element => element != null)
            .forEach(element => element.x(element.x() + offsetX));
    }

    private translateElementsY(elements: Element[], offsetY: number): void {
        elements
            .filter(element => element != null)
            .forEach(element => element.y(element.y() + offsetY));
    }

    private getAllElements(): Element[] {
        const types = ["rect", "line", "text"];
        return this.shapesGenerator.paper.children().filter(e => types.includes(e.type));
    }
}