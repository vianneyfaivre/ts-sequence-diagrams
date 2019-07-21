import { ActorElement, SignalElement, SignalType, LineType, Dimensions, TitleElement } from "../dao/draw/model";
import ItemsGenerator from "../facade/ItemsGenerator";
import { Signal, Actor } from "../dao/parser/model";
import { ShapesGenerator } from "../dao/draw/ShapesGenerator";
import AdjustmentsEngine from "../facade/AdjustmentsEngine";
import {Element} from "@svgdotjs/svg.js";

/**
 * Generates the whole Sequence Diagram, also it does error handling and logging
 */
export class SvgEngine {

    itemsGenerator: ItemsGenerator;
    adjustmentsEngine: AdjustmentsEngine;

    container: HTMLElement;
    title?: TitleElement;
    actors: ActorElement[];
    signals: SignalElement[];
    destroyedActors: Actor[];

    constructor(svgElementId: string) {
        this.container = document.getElementById(svgElementId) as unknown as HTMLElement;
        const shapesGenerator = new ShapesGenerator(this.container);

        this.itemsGenerator = new ItemsGenerator(shapesGenerator);
        this.adjustmentsEngine = new AdjustmentsEngine(this.container, shapesGenerator);

        this.actors = [];
        this.signals = [];
        this.destroyedActors = [];
    }

    drawTitle(title: string): void {
        const titleX = "50%";
        const titleY = 10;

        this.title = this.itemsGenerator.drawTitle(titleX, titleY, title);
    }

    drawSignals(signals: Signal[], hasTitle: boolean): void {

        let initialOffset = Dimensions.SVG_PADDING + Dimensions.DISTANCE_BETWEEN_SIGNALS;
        if(hasTitle) {
            initialOffset += Dimensions.TITLE_HEIGHT;
        } 
        
        let offsetY = initialOffset;

        for(const signal of signals) {
            if(signal.type === SignalType.SIMPLE) {
                console.log(`Drawing ${signal}`);

                const actorElA = this._getActorElement(signal.actorA, false);
                const actorElB = this._getActorElement(signal.actorB, false);
                const actorElACreatedBySignal = this._getActorElement(signal.actorA, true);
                const actorElBCreatedBySignal = this._getActorElement(signal.actorB, true);

                if(!actorElA && !actorElACreatedBySignal) {
                    console.error(`Can't draw ${signal} because Actor A '${signal.actorA.name}' has not been drawn`);
                }
                
                if(!actorElB && !actorElBCreatedBySignal) {
                    console.error(`Can't draw ${signal} because Actor B '${signal.actorB.name}' has not been drawn`);
                }

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
                        offsetY += Dimensions.DISTANCE_BETWEEN_SIGNALS * 2;
                    } else {
                        offsetY += Dimensions.DISTANCE_BETWEEN_SIGNALS;
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

                offsetY += Dimensions.DISTANCE_BETWEEN_SIGNALS;
            }
            else if(signal.type === SignalType.ACTOR_DELETION) {
                
                let actorElement = this._getActorElement(signal.actorA, true);
                if(!actorElement) {
                    actorElement = this._getActorElement(signal.actorA, false);
                }
                
                if(actorElement) {
                    console.log(`Drawing destruction of actor '${signal.actorA}'`);

                    const [actorLine, actorCross] = this.itemsGenerator.destroyActor(actorElement, offsetY);
                    
                    actorElement.line = actorLine;
                    actorElement.cross = actorCross;
                    actorElement.destroyed = true;

                    // Update state
                    this.destroyedActors.push(signal.actorA);
                    offsetY += Dimensions.DISTANCE_BETWEEN_SIGNALS;
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

    drawActors(actors: Actor[], hasTitle: boolean): void {

        let offsetX = Dimensions.SVG_PADDING;

        let initialOffset = Dimensions.SVG_PADDING;
        if(hasTitle) {
            initialOffset += Dimensions.TITLE_HEIGHT;
        } 

        let offsetY = initialOffset;

        for (const actorName in actors) {

            const actor = actors[actorName];

            // Actors created by a signal will be drawn when the signal is being drawn
            if(actor.createdBySignal === false) {
                console.log(`Drawing Actor '${actor.name}'`);

                const actorEl = this.itemsGenerator.drawActor(actor, offsetX, offsetY);
                
                this.actors.push(actorEl);
    
                offsetX += Dimensions.DISTANCE_BETWEEN_ACTORS;
            }
        }
    }

    adjustActorsAndSignals(): void {

        console.log("** AUTO_ADJUSTING **");

        // a. Reorder actors 
        const actorsSorted = this.actors.sort((e1, e2) => {
            const diff = e1.line.bbox().x - e2.line.bbox().x;

            // When the line are overlapping perfectly
            if(diff === 0) {
                return 1;
            } 

            return diff;
        });
        
        let allActors = '';
        for (const i in actorsSorted) {
            const actorEl = actorsSorted[i];
            allActors += `${actorEl.actor.name}, `;
        }
        
        console.log(`Actors sorted: ${allActors}`);

        this.adjustmentsEngine.adjustActorsAndSignals(actorsSorted);
    }

    resizeSvg(): void {
        console.log("** RESIZING SVG **");
        this.adjustmentsEngine.resizeSvg(this.actors, this.title);
    }

    printCurrentState(): void {

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
            const aBeforeB = actorElA.actor.order < actorElB.actor.order;
            actorElA.outgoingSignals.push(signalElement);
            actorElB.incomingSignals.push(signalElement);
        } 
        // From B to A
        else if(signalElement.lineType === LineType.RESPONSE) {
            const aBeforeB = actorElA.actor.order < actorElB.actor.order;
            actorElB.outgoingSignals.push(signalElement);
            actorElA.incomingSignals.push(signalElement);
        } else {
            console.warn(`Unknown line type '${signalElement.lineType}'`);
        }
    }
}