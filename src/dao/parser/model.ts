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


export class BlockStack {

    currentDepth: number = 0;
    blocks: BlockData[] = [];

    startBlock(block: BlockData): void {
        block.level = this.currentDepth++;
        this.blocks.push(block);
    }

    endBlock(): BlockData {
        const block = this.blocks[this.currentDepth - 1];
        this.currentDepth--;
        return block;
    }

    toString(): string {
        return `Stack with ${this.blocks.length} blocks`;
    }
}

export enum BlockType {
    loop
}

export class BlockData {

    level: number;

    constructor(readonly type: BlockType,
                readonly label: string
        ) {}
        
    toString(): string {
        return `Level=${this.level} Type=${this.type} Label=${this.label}`;
    }
}