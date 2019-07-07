import Actor from "../model/Actor";
import { Signal, SignalType, LineType } from "../model/Signal";
import ItemsGenerator, { ACTOR_RECT_MIN_X_PADDING } from "./ItemsGenerator";
import { ActorElement, SignalElement } from "./model";

const DISTANCE_BETWEEN_SIGNALS = 50;
const DISTANCE_BETWEEN_ACTORS = 200;

/**
 * Generates the whole Sequence Diagram, also it does error handling and logging
 */
export default class SvgEngine {

    itemsGenerator: ItemsGenerator;
    actors: ActorElement[];
    signals: SignalElement[];
    destroyedActors: Actor[];

    constructor(svgElementId: string) {
        const container = document.getElementById(svgElementId) as unknown as SVGElement;
        this.itemsGenerator = new ItemsGenerator(container);
        this.actors = [];
        this.signals = [];
        this.destroyedActors = [];
    }

    drawSignals(signals: Signal[]) {
        
        var offsetY = DISTANCE_BETWEEN_SIGNALS;

        for(const signal of signals) {
            if(signal.type === SignalType.SIMPLE) {
                console.log(`Drawing ${signal}`);

                const actorElA = this._getActorElement(signal.actorA, false);
                const actorElB = this._getActorElement(signal.actorB, false);
                const actorElACreatedBySignal = this._getActorElement(signal.actorA, true);
                const actorElBCreatedBySignal = this._getActorElement(signal.actorB, true);

                const signalElement = this.itemsGenerator.drawSignal(signal, offsetY, actorElA, actorElB, actorElACreatedBySignal, actorElBCreatedBySignal);

                if(signalElement === null) {
                    //TODO throw ex
                    console.error(`Can't draw ${signal}`);
                }
                else {
                    // Update state
                    this.signals.push(signalElement);
                    this._updateActorElementSignals(signalElement, signal.toSameActor());

                    if(signal.toSameActor()) {
                        offsetY += DISTANCE_BETWEEN_SIGNALS * 2;
                    } else {
                        offsetY += DISTANCE_BETWEEN_SIGNALS;
                    }
                }

            }
            else if(signal.type === SignalType.ACTOR_CREATION) {

                console.log(`Drawing Actor '${signal.actorB.name}' created by a Signal`);

                let actorElA = this._getActorElement(signal.actorA, false);
                if(!actorElA) {

                    actorElA = this._getActorElement(signal.actorA, true);

                    if(!actorElA) {
                        console.warn(`Can't draw signal because Actor A '${signal.actorA}' has not been drawn yet`);
                        // TODO error handling
                        continue;
                    }
                }
                
                const actorElB = this._getActorElement(signal.actorB, true);
                if(actorElB) {
                    console.warn(`Can't draw signal because Actor B '${signal.actorB}' has already been drawn`);
                    // TODO error handling
                    continue;
                }

                let [signalElement, actorB] = this.itemsGenerator.drawSignalAndActor(signal, actorElA, offsetY);

                // Update state
                this.actors.push(actorB);
                this.signals.push(signalElement);
                this._updateActorElementSignals(signalElement);

                offsetY += DISTANCE_BETWEEN_SIGNALS;
            }
            else if(signal.type === SignalType.ACTOR_DELETION) {
                
                let actorElement = this._getActorElement(signal.actorA, true);
                if(!actorElement) {
                    actorElement = this._getActorElement(signal.actorA, false);
                }
                
                if(actorElement) {
                    console.log(`Drawing destruction of actor '${signal.actorA}'`);

                    const signalElement = this.itemsGenerator.destroyActor(actorElement, offsetY);
                    
                    // Update state
                    this.destroyedActors.push(signal.actorA);
                    actorElement.destroyed = true;
                    offsetY += DISTANCE_BETWEEN_SIGNALS;
                } else {
                    console.warn(`Can't draw destruction of actor '${signal.actorA}'`);
                    // TODO error handling
                    continue;
                }
            }
        }

        // Draw actors lines for those who has not been destroyed 
        this.itemsGenerator.drawActorLines(this.actors, this.destroyedActors, offsetY);
    }

    drawActors(actors: Actor[]) {

        let offsetX = 0;

        for (const actorName in actors) {

            const actor = actors[actorName];

            // Actors created by a signal will be drawn when the signal is being drawn
            if(actor.createdBySignal === false) {
                console.log(`Drawing Actor '${actor.name}'`);
                const actorEl = this.itemsGenerator.drawActor(actor, offsetX, 0);
                this.actors.push(actorEl);
    
                offsetX += DISTANCE_BETWEEN_ACTORS;
            }
        }
    }

    adjustSignals(actorsSorted: ActorElement[], nextActors: ActorElement[], actor: ActorElement, i: number) {
        const actorSignals = [
            ...actor.selfSignals,
            ...actor.incomingSignals,
            ...actor.outgoingSignals
        ];

        // TODO put as fn parameters
        const beforeActor = actorsSorted[+i-1];
        const nextActor = actorsSorted[+i+1];

        // Move actors
        for(const j in actorSignals) {
            const signal = actorSignals[j];

            // if(beforeActor){
            //     const [shouldMove, offsetX] = this.itemsGenerator.isSignalTextTooLong(signal, beforeActor);
            //     if(shouldMove === true) {
            //         console.log("SHOULD MOVE BEFORE");
            //         // TODO : move the actor before and all next actors
            //     }
            // }

            if(nextActor){
                const [shouldMove, offsetX] = this.itemsGenerator.isSignalTextTooLong(signal, nextActor);
                if(shouldMove === true) {
                    nextActors.forEach(a => this.itemsGenerator.moveActor(a, offsetX));
                }
            }

            this._updateSignals(actor);
        }

        // this._updateSignals(actor);
    }

    _updateSignals(actor: ActorElement): void {
        const inoutSignals = [
            ...actor.incomingSignals,
            ...actor.outgoingSignals
        ];

        // Redraw signals start and end
        for(const j in inoutSignals) {
            const signal = inoutSignals[j];

            if(signal.signalType === SignalType.SIMPLE) {
                
                if(signal.lineType === LineType.REQUEST) {

                    const shouldBeAdjusted = (signal.actorA.line.getBBox().x !== signal.line.getBBox().x) 
                                            || (signal.actorB.line.getBBox().x !== signal.line.getBBox().x2) 

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

    autoAdjust() {

        console.log("** AUTO_ADJUSTING **");

        // a. Reorder actors 
        const actorsSorted = this.actors.sort((e1, e2) => {
            return e1.line.getBBox().x - e2.line.getBBox().x;
        });
        
        let allActors = '';
        for (const i in actorsSorted) {
            const actorEl = actorsSorted[i];
            allActors += `${actorEl.actor.name}, `;
        }
        console.log(`Actors: ${allActors}`);

        // b. Adjust actor top/bottom rectangles
        console.log("* RESIZING ACTOR RECTANGLES *");
        for (const i in actorsSorted) {
            const actorEl = actorsSorted[i];

            const actorToResize = this.itemsGenerator.shouldResizeActor(actorEl);
            if(actorToResize === true) {
                this.itemsGenerator.resizeActor(actorEl);
            }
        }

        // c. Adjust space between actors
        console.log("* ADJUSTING SPACE BETWEEN ACTORS *");
        for (const i in actorsSorted) {
            const actorEl = actorsSorted[i];
            const nextActor = actorsSorted[+i+1];

            const [shouldMove, offsetX] = this.itemsGenerator.shouldMoveActor(actorEl, nextActor, DISTANCE_BETWEEN_ACTORS);
            if(shouldMove === true) {
                this.itemsGenerator.moveActor(nextActor, offsetX);
            }
        }

        // d. Adjust space between actors if text is too long
        console.log("* ADJUSTING BASED ON SIGNAL TEXT WIDTH *");
        for (const i in actorsSorted) {

            const actorEl = actorsSorted[i];
            const nextActors = actorsSorted.slice(+i+1);

            // if(!nextActors || nextActors.length === 0) {
            //     break;
            // }

            console.log(`* ADJUSTING ACTOR ${actorEl.actor.name} SIGNALS*`);

            this.adjustSignals(actorsSorted, nextActors, actorEl, +i);
        }

        // e. Redraw signals
        // console.log("* REDRAWING SIGNALS *");

        // for (const i in this.actors) {
        //     const actorEl = this.actors[i];

            // Check actor elements
            // const actorToResize = this.itemsGenerator.shouldResizeActor(actorEl);
            // if(actorToResize === true) {
            //     const actorsBefore = this.actors.slice(0, +i);
            //     const actorsAfter = this.actors.slice(+i+1, this.actors.length);
                
                // TODO: 
                //     - reajuster les acteurs (top et bottom rectangles)
                //     - ré-espacer les acteurs
                //     - rallonger les signaux quand le texte est plus long que les trois quarts de la line.width 
                //         - penser a décaler tous les prochains acteurs dans ce cas la
                //             - offset = new line width - old width
                //     - replacer si besoin les acteurs
                //     - replacer les signaux  
                //         - signal x1 == actor a . x 
                //         - signal x2 == actor b . x 

                // this.itemsGenerator.resizeActor(actorEl);

                // this.itemsGenerator.moveActor(actorEl, actorBefore, actorAfter, newRectWidth);
            // }

            // Check signal elements

            // TODO write condition (signal text too long, actor rect text too long (x2))
            // if(actorEl.actor.name === 'Server') {
            //     const actorBefore = this.actors.slice(0, +i);
            //     const actorAfter = this.actors.slice(+i+1, this.actors.length);
            //     this.itemsGenerator.moveActor(actorEl, actorBefore, actorAfter, 100);
            // }
        // }

        // TODO Adjust the SVG container size
        // TODO set svg view box https://vanseodesign.com/web-design/svg-viewbox/
    }

    printCurrentState() {

        console.log("* ACTORS CURRENTLY DRAWN");
        for (const actorName in this.actors) {

            const actorEl = this.actors[actorName];
            console.log(actorEl.toString());
        }

        console.log("* ACTORS THAT HAVE BEEN DESTROYED");
        for (const actorName in this.destroyedActors) {

            const actorEl = this.destroyedActors[actorName];
            console.log(actorEl.toString());
        }

        console.log("* SIGNALS CURRENTLY DRAWN");
        for (const signalName in this.signals) {

            const signalEl = this.signals[signalName];
            console.log(signalEl.toString());
        }
    }

    _getActorElement(actor: Actor, createdBySignal: boolean): ActorElement {
        return this.actors.filter(a => {
            const byName = a.actor.name === actor.name;
            const type = a.actor.createdBySignal === createdBySignal;
            return byName && type;
        }).pop();
    }

    _updateActorElementSignals(signalElement: SignalElement, sameActor?: boolean): void {
        
        const actorElA = signalElement.actorA;
        const actorElB = signalElement.actorB; 

        // From A to A
        if(sameActor === true) {
            actorElA.selfSignals.push(signalElement);
        }
        // From A to B
        else if(signalElement.lineType === LineType.REQUEST) {
            actorElA.outgoingSignals.push(signalElement);
            actorElB.incomingSignals.push(signalElement);
        } 
        // From B to A
        else if(signalElement.lineType === LineType.RESPONSE) {
            actorElA.outgoingSignals.push(signalElement);
            actorElB.incomingSignals.push(signalElement);
        } else {
            console.warn(`Unknown line type '${signalElement.lineType}'`);
        }
    }
}