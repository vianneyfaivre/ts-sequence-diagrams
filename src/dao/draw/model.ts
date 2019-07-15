import * as Snap from 'snapsvg';
import { Actor } from '../parser/model';

export class ActorElement {

    readonly incomingSignals: SignalElement[];
    readonly outgoingSignals: SignalElement[];
    readonly selfSignals: SignalElement[];
    bottomRect: ActorRect;
    line: Snap.Element;
    destroyed: boolean;
    cross: CrossElement;

    constructor(
        readonly actor: Actor,
        readonly topRect: ActorRect
    ) {
        this.incomingSignals = [];
        this.outgoingSignals = [];
        this.selfSignals = [];
        this.destroyed = false;
    }

    toString(): String {
        let hasBottomRect = false;
        if(this.bottomRect) {
            hasBottomRect = true;
        }
        
        return `Actor '${this.actor.name}'. Signals: outgoing=${this.outgoingSignals.length} incoming=${this.incomingSignals.length} self=${this.selfSignals.length}. bottomRect=${hasBottomRect}. dies=${this.destroyed}`;
    }
}

export class CrossElement {
    constructor(
        readonly line1: Snap.Element, 
        readonly line2: Snap.Element
    ) {}
} 

export class ActorRect {

    constructor(
        readonly rect: Snap.Element, 
        readonly text: Snap.Element
    ) {}

    shouldBeResized() : boolean {
        return this.text.getBBox().width >= this.rect.getBBox().width;
    }
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

    toSameActor() {
        return this.actorA.actor.name === this.actorB.actor.name; 
    }

    toString() {
        const toSelf = this.actorA.actor.name === this.actorB.actor.name;
        
        if(toSelf === true) {
            return `Self-Signal '${this.actorA.actor.name}': '${this.text.innerSVG()}'`;
        } else {
            return `Signal from '${this.actorA.actor.name}' to '${this.actorB.actor.name}': '${this.text.innerSVG()}'`;
        }
    }
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

export enum LineOption {
    END_MARKER,
    START_MARKER,
    DOTTED
}

export enum TextOption {
    CENTERED
}

export class Dimensions {

    /* X and Y padding of the whole SVG */
    static SVG_PADDING = 10;

    /* Y distance between two signals */
    static DISTANCE_BETWEEN_SIGNALS = 50;

    /* X distance between two actors */
    static DISTANCE_BETWEEN_ACTORS = 150;

    /* X width of a destroyed actor across */
    static CROSS_WIDTH = 20;

    /* Actor top/bottom rectangle width */
    static ACTOR_RECT_WIDTH = 100;
    
    /* Actor top/bottom rectangle height */
    static ACTOR_RECT_HEIGHT = 50;
    
    /* Actor top/bottom rectangle text X (left and right) padding */
    static ACTOR_RECT_MIN_X_PADDING = 5;

    /* Self signal line width */
    static SIGNAL_SELF_WIDTH = 25;

    /* Self signal line height */
    static SIGNAL_SELF_HEIGHT = 50;

    /* Self signal text Y padding */
    static SIGNAL_SELF_TEXT_PADDING_Y = Dimensions.SIGNAL_SELF_HEIGHT / 2;

    /* Signal text X padding */
    static SIGNAL_TEXT_PADDING_X = 5;

    /* Signal text Y padding */
    static SIGNAL_TEXT_PADDING_Y = 5;

    /* Signal X padding */
    static SIGNAL_OVERLAPPING_ACTOR_X_OFFSET = 10;

    /* Actor Creation Signal line width */
    static SIGNAL_CREATION_WIDTH = 100;
}