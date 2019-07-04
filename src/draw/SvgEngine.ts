import Actor from "../model/Actor";
import { Signal, SignalType, LineType } from "../model/Signal";
import ItemsGenerator from "./ItemsGenerator";
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

            if(actor.createdBySignal === false) {
                console.log(`Drawing Actor '${actor.name}'`);
                const actorEl = this.itemsGenerator.drawActor(actor, offsetX, 0);
                this.actors.push(actorEl);
    
                offsetX += DISTANCE_BETWEEN_ACTORS;
            }
        }
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
            console.log(actorElA.actor.name + " REQ "+actorElB.actor.name);
            actorElA.outgoingSignals.push(signalElement);
            actorElB.incomingSignals.push(signalElement);
        } 
        // From B to A
        else if(signalElement.lineType === LineType.RESPONSE) {
            console.log(actorElA.actor.name + " RESP "+actorElB.actor.name);
            actorElA.outgoingSignals.push(signalElement);
            actorElB.incomingSignals.push(signalElement);
        } else {
            console.warn(`Unknown line type '${signalElement.lineType}'`);
        }
    }
}