import Actor from "../model/Actor";
import { Signal, SignalType } from "../model/Signal";
import ItemsGenerator from "./ItemsGenerator";
import { ActorElement, SignalElement } from "./model";

const DISTANCE_BETWEEN_SIGNALS = 50;
const DISTANCE_BETWEEN_ACTORS = 200;

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

                if(signal.toSameActor()) {
                    offsetY += DISTANCE_BETWEEN_SIGNALS * 2;
                } else {
                    offsetY += DISTANCE_BETWEEN_SIGNALS;
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

                let [signalCreation, actorB] = this.itemsGenerator.drawSignalAndActor(signal, actorElA, offsetY);

                this.actors.push(actorB);
                // TODO update ActorElement with signalCreation / signal

                offsetY += DISTANCE_BETWEEN_SIGNALS;
            }
            else if(signal.type === SignalType.ACTOR_DELETION) {
                
                let actorElement = this._getActorElement(signal.actorA, true);
                if(!actorElement) {
                    actorElement = this._getActorElement(signal.actorA, false);
                }
                
                if(actorElement) {
                    console.log(`Drawing destruction of actor '${signal.actorA}'`);
                    this.itemsGenerator.destroyActor(actorElement, offsetY);
                    this.destroyedActors.push(signal.actorA);
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

        // TODO update ActorElement with signal
    }

    drawActors(actors: Actor[]) {

        var offsetX = 0;

        for (const actorName in actors) {

            var actor = actors[actorName];

            if(actor.createdBySignal === false) {
                console.log(`Drawing Actor '${actor.name}'`);
                var actorRect = this.itemsGenerator.drawActor(actor, offsetX, 0);
                this.actors.push(actorRect);
    
                offsetX += DISTANCE_BETWEEN_ACTORS;
            }
        }
    }

    printCurrentState() {
        console.log("TODO");
    }

    _getActorElement(actor: Actor, createdBySignal: boolean): ActorElement {
        return this.actors.filter(a => {
            const byName = a.actor.name === actor.name;
            const type = a.actor.createdBySignal === createdBySignal;
            return byName && type;
        }).pop();
    }
}