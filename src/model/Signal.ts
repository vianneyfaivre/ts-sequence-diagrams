import Actor from "./Actor";

export default class Signal {
    actorA: Actor;
    actorB: Actor;
    lineType: string;
    arrowType: string;
    message: string;

    constructor(actorA: Actor, actorB: Actor, lineType: string, arrowType: string, message: string) {
        this.actorA = actorA;
        this.actorB = actorB;
        this.lineType = lineType;
        this.arrowType = arrowType;
        this.message = message;
    }

    toString() {
        return "From "+this.actorA+" to "+this.actorB+" : "+this.message;
    }
}