import Actor from "../model/Actor";
import Signal from "../model/Signal";

export default class ParserScope {

    actors: Actor[];
    signals: Signal[];

    constructor() {
        this.actors = [];
        this.signals = [];
    }
    
    createSignal = function(actorA: string, signalType: string, actorB: string, message: string) {
        console.log(`Creating signal : ${actorA.toString()} ${signalType} ${actorB.toString()} ${message}`);

        var actorA_ = this.getActor(actorA);
        var actorB_ = this.getActor(actorB);

        var lineType = signalType.split('_')[0];
        var arrowType = signalType.split('_')[1];

        return new Signal(actorA_, actorB_, lineType, arrowType, message);
    }

    createNote = function(a: string, b: string, c: string) {
        console.log(`Creating note : ${a} ${b} ${c}`);
    }

    getActor = function(name: string) {
        console.log(`Get actor : ${name} ${name.toString()}`);
        if(!this.actors[name]) {
            this.actors[name] = new Actor(name);
        }
        return this.actors[name];
    }

    addSignal = function(signal: Signal) {
        console.log(`Adding signal : ${signal.toString()}`);
        this.signals.push(signal);
    }

    setTitle = function(a: string) {
        console.log(`Setting title : ${a}`);
    }
}