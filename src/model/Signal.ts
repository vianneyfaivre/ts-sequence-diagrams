import Actor from "./Actor";

enum LineType {
    REQUEST,
    RESPONSE
}

class Signal {
    actorA: Actor;
    actorB: Actor;
    lineType: LineType;
    arrowType: string;
    message: string;

    constructor(actorA: Actor, actorB: Actor, lineType: string, arrowType: string, message: string) {
        this.actorA = actorA;
        this.actorB = actorB;
        if(lineType === "--") {
            this.lineType = LineType.RESPONSE;
        } else {
            this.lineType = LineType.REQUEST;
        }
        this.arrowType = arrowType;
        this.message = message;
    }

    toSameActor() {
        return this.actorA.name === this.actorB.name; 
    }
    
    toString() {
        return "From "+this.actorA+" to "+this.actorB+" : "+this.message;
    }
}

export {LineType, Signal};