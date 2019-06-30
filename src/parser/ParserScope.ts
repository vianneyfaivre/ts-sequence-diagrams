import Actor from "../model/Actor";
import {Signal} from "../model/Signal";

export default class ParserScope {

    actors: Actor[];
    actorsCreatedBySignal: Actor[];
    signals: Signal[];

    constructor() {
        this.actors = [];
        this.actorsCreatedBySignal = [];
        this.signals = [];
    }
    
    createSignal = function(actorA: string, signalType: string, actorB: string, message: string) {
        console.log(`Creating signal : ${actorA.toString()} ${signalType} ${actorB.toString()} ${message}`);

        var actorA_ = new Actor(actorA);
        var actorB_ = new Actor(actorB);
        var lineType = signalType.split('_')[0];
        var arrowType = signalType.split('_')[1];

        const actorAAlreadyExists = this.actorsCreatedBySignal[actorA];
        const actorBAlreadyExists = this.actorsCreatedBySignal[actorB];

        if(arrowType === ">*") { 
            this.getOrCreate(actorA);
            this.actorsCreatedBySignal[actorB] = actorB_;
        } 
        else if (actorAAlreadyExists === false && actorBAlreadyExists == false){
            this.getOrCreate(actorA);
            this.getOrCreate(actorB);
        } 

        return Signal.simple(actorA_, actorB_, lineType, arrowType, message);
    }

    createNote = function(a: string, b: string, c: string) {
        console.log(`Creating note : ${a} ${b} ${c}`);
    }

    createActor = function(name: string) {
        console.log(`Create actor : ${name}`);
        this.actors[name] = new Actor(name);
        return this.actors[name];
    }

    getActor = function(name: string) {
        console.log(`Get actor : ${name}`);
        return this.actors[name];
    }

    getOrCreate = function(name: string) {
        var actor = this.actors[name];
        if(!actor) {
            return this.createActor(name);
        } 
        return actor;
    }

    addSignal = function(signal: Signal) {
        console.log(`Adding signal : ${signal.toString()}`);
        this.signals.push(signal);
    }

    setTitle = function(title: string) {
        console.log(`Setting title : ${title}`);
    }

    destroyActor = function(actor: string) {
        console.log(`Destroying actor : ${actor}`);
        this.signals.push(Signal.destroy(new Actor(name)));
    }
}