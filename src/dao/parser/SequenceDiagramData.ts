import { Actor, Signal } from "./model";

export class SequenceDiagramData {

    actorOrder: number;
    actors: Actor[];
    signals: Signal[];

    constructor() {
        this.actorOrder = 0;
        this.actors = [];
        this.signals = [];
    }
    
    getOrCreate = function(name: string, createdBySignal: boolean) {
        var actor = this.actors[name];
        if(!actor) {
            console.log(`Identified actor #${this.actorOrder}: ${name}`);
            actor = new Actor(this.actorOrder, name, createdBySignal);
            this.actors[name] = actor;
            this.actorOrder++;
        } 
        return actor;
    }
    
    createSignal = function(actorA: string, signalType: string, actorB: string, message: string) {
        console.log(`Parsed signal : ${actorA.toString()} ${signalType} ${actorB.toString()}`);

        var actorA_ = this.actors[actorA];
        var actorB_ = this.actors[actorB];
        var lineType = signalType.split('_')[0];
        var arrowType = signalType.split('_')[1];

        // Actor creation by signal
        if(arrowType === ">*") { 

            if(!actorA_) {
                actorA_ = this.getOrCreate(actorA, false);
            }

            if(!actorB_) {
                actorB_ = this.getOrCreate(actorB, true);
            }
        } 
        // Classic actor
        else {
            if(!actorA_) {
                actorA_ = this.getOrCreate(actorA, false);
            }

            if(!actorB_) {
                actorB_ = this.getOrCreate(actorB, false);
            }
        }

        if(actorA_ !== null && actorB_ != null) {
            return Signal.simple(actorA_, actorB_, lineType, arrowType, message);
        } else {
            console.error(`Unable to parse : ${actorA.toString()} ${signalType} ${actorB.toString()}`);
        }
    }

    createNote = function(a: string, b: string, c: string) {
        console.log(`Parsed note : ${a} ${b} ${c}`);
    }

    addSignal = function(signal: Signal) {
        console.log(`Adding signal : ${signal.toString()}`);
        this.signals.push(signal);
    }

    setTitle = function(title: string) {
        console.log(`Parsed title : ${title}`);
    }

    destroyActor = function(actor: string) {
        console.log(`Identified actor to destroy : ${actor}`);

        var actor_ = this.actors[actor];

        if(actor_) {

            if(actor_.createdBySignal === true) {
                this.signals.push(Signal.destroy(actor_));
            } else {
                console.error(`Unable to destroy actor '${actor}' because it has not been created by a signal`);
            }
        } else {
            console.error(`Unable to destroy actor '${actor}' because it does not exist`);
        }
    }
}