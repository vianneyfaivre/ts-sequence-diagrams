import Actor from "../model/Actor";
import * as Snap from 'snapsvg';

export class ActorElement {

    readonly incomingSignals: SignalElement[];
    readonly outgoingSignals: SignalElement[];
    readonly selfSignals: SignalElement[];
    bottomRect: ActorRect;
    line: Snap.Element;

    constructor(
        readonly actor: Actor,
        readonly topRect: ActorRect
    ) {
        this.incomingSignals = [];
        this.outgoingSignals = [];
        this.selfSignals = [];
    }

    toString() {
        let hasBottomRect = false;
        if(this.bottomRect) {
            hasBottomRect = true;
        }
        
        let hasLine = false;
        if(this.line) {
            hasLine = true;
        }

        return `Actor '${this.actor.name}'. Signals: outgoing=${this.outgoingSignals.length} incoming=${this.incomingSignals.length} self=${this.selfSignals.length}. bottomRect=${hasBottomRect}. line=${hasLine}`;
    }
}

export class ActorRect {

    constructor(
        readonly rect: Snap.Element, 
        readonly text: Snap.Element
    ) {}
}

export class SignalElement {

    static forward(line: Snap.Element, lineType: LineType, signalType: SignalType, text: Snap.Element, actorA: ActorElement, actorB: ActorElement): SignalElement {
        return new SignalElement(line, [], lineType, signalType, text, actorA, actorB);
    }
    
    static backward(line: Snap.Element, lineType: LineType, text: Snap.Element, actorA: ActorElement, actorB: ActorElement): SignalElement {
        return new SignalElement(line, [], lineType, SignalType.SIMPLE, text, actorA, actorB);
    }

    static self(lines: Snap.Element[], lineType: LineType, text: Snap.Element, actor: ActorElement): SignalElement {
        return new SignalElement(null, lines, lineType, SignalType.SIMPLE, text, actor, actor);
    }

    private constructor(
        readonly line: Snap.Element,
        readonly lines: Snap.Element[], // empty unless signal==self
        readonly lineType: LineType,
        readonly signalType: SignalType,
        readonly text: Snap.Element,
        readonly actorA: ActorElement,
        readonly actorB: ActorElement
    ) {}
}

export enum SignalDirection {
    FORWARD,
    BACKWARD
}

export enum LineType {
    REQUEST,
    RESPONSE
}

export enum SignalType {
    SIMPLE,
    ACTOR_CREATION,
    ACTOR_DELETION
}