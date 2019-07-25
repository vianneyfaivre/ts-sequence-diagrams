import { LineType, SignalType } from "../draw/model";

export class Actor {

    constructor(readonly order: number,
                readonly name: string, 
                readonly createdBySignal: boolean) {
    }

    toString() {
        return this.name;
    }
}

export class Signal {
    actorA: Actor;
    actorB: Actor;
    lineType: LineType;
    type: SignalType;
    message: string;

    static destroy(actor: Actor): Signal {
        return new Signal(actor, null, LineType.REQUEST, SignalType.ACTOR_DELETION, "");
    }

    static simple(actorA: Actor, actorB: Actor, lineType: string, arrowType: string, message: string): Signal {

        var lineType_ = LineType.REQUEST;
        if(lineType === "--") {
            lineType_ = LineType.RESPONSE;
        } 

        var type_ = SignalType.SIMPLE;
        if(arrowType === ">*") {
            type_ = SignalType.ACTOR_CREATION;
        }

        return new Signal(actorA, actorB, lineType_, type_, message);
    }

    constructor(actorA: Actor, actorB: Actor, lineType: LineType, type: SignalType, message: string) {
        this.actorA = actorA;
        this.actorB = actorB;
        this.message = message;
        this.type = type;
        this.lineType = lineType;
    }

    toSameActor() {
        return this.actorA.name === this.actorB.name; 
    }
    
    toString() {
        if(this.type === SignalType.ACTOR_CREATION) {
            return `Signal: Actor ${this.actorA.name} creates ${this.actorB.name}`;
        }
        else if(this.type === SignalType.ACTOR_DELETION) {
            return `Signal: Actor ${this.actorA.name} to be destroyed`;
        }
        else if(this.type === SignalType.SIMPLE && this.lineType == LineType.REQUEST && this.toSameActor()) {
            return `Self-Signal: From/to '${this.actorA.name}'`;
        }
        else if(this.type === SignalType.SIMPLE && this.lineType == LineType.REQUEST) {
            return `Signal: Request from '${this.actorA.name}' to '${this.actorB.name}'`;
        }
        else if(this.type === SignalType.SIMPLE && this.lineType == LineType.RESPONSE) {
            return `Signal: Response from '${this.actorA.name}' to '${this.actorB.name}'`;
        }
        else {
            console.error(`Signal Invalid: From '${this.actorA.name}' to '${this.actorB.name}'`);
        }
    }
}


export class Blocks {

    blocks: BlockData[] = [];

    nextLevel(): number {
        return this.blocks.length + 1;
    }

    push(block: BlockData): void {
        this.blocks.push(block);
    }

    pop(): BlockData {
        return this.blocks.pop();
    }

    last(): BlockData {
        if(this.blocks.length > 0) {
            return this.blocks[this.blocks.length - 1];
        }

        return null;
    }

    inLoop(): boolean {
        return this.blocks.length > 0;
    }
}

export enum BlockType {
    loop
}

export class BlockData {

    constructor(readonly level: number,
                readonly type: BlockType,
                readonly label: string
        ) {}
        
    toString(): string {
        return `Level=${this.level} Type=${this.type} Label=${this.label}`;
    }
}