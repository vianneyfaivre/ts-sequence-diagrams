import {Element, Text, Line, Rect} from "@svgdotjs/svg.js";
import { Actor, Signal, BlockData } from '../parser/model';

export class TitleElement {
    constructor(readonly title: Text) {
    }
}

export class ActorElement {

    readonly incomingSignals: SignalElement[];
    readonly outgoingSignals: SignalElement[];
    readonly selfSignals: SignalElement[];
    bottomRect?: ActorRect;
    line: Line;
    destroyed: boolean;
    cross?: CrossElement;

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

    svgElements(): Element[] {

        const signals: Element[] = [];

        for(const signal of this.incomingSignals) {

            if(!signals[signal.id]) {
                signals.push(...signal.svgElements());
            }
        }

        for(const signal of this.outgoingSignals) {

            if(!signals[signal.id]) {
                signals.push(...signal.svgElements());
            }
        }

        for(const signal of this.selfSignals) {

            if(!signals[signal.id]) {
                signals.push(...signal.svgElements());
            }
        }

        const elements: Element[] = [];

        elements.push(this.line);
        elements.push(...this.topRect.svgElements());
        elements.push(...signals);

        if(this.cross) {
            elements.push(...this.cross.svgElements());
        }

        if(this.bottomRect) {
            elements.push(...this.bottomRect.svgElements());
        }

        return elements;
    }
}

export class BlockStackElement {
    
    constructor(readonly blocks: BlockElement[]) {
    }
}

export class BlockElement {

    constructor(readonly blockTypeLabel: Text,
                readonly blockTypeRect: Rect,
                readonly blockLabel: Text,
                readonly blockRect: Rect) {
    }
}

export class CrossElement {
    constructor(
        readonly line1: Line, 
        readonly line2: Line
    ) {}

    svgElements(): Element[] {
        return [this.line1, this.line2];
    }
} 

export class ActorRect {

    constructor(
        readonly rect: Rect, 
        readonly text: Text
    ) {}

    shouldBeResized() : boolean {
        return this.text.bbox().width >= this.rect.bbox().width;
    }

    svgElements(): Element[] {
        return [this.rect, this.text];
    }
}

export class SignalElement {

    static forward(id: number, line: Line, lineType: LineType, signalType: SignalType, text: Text, actorA: ActorElement, actorB: ActorElement): SignalElement {
        return new SignalElement(id, line, [], lineType, signalType, text, actorA, actorB);
    }
    
    static backward(id: number, line: Line, lineType: LineType, text: Text, actorA: ActorElement, actorB: ActorElement): SignalElement {
        return new SignalElement(id, line, [], lineType, SignalType.SIMPLE, text, actorA, actorB);
    }

    static self(id: number, lines: Line[], lineType: LineType, text: Text, actor: ActorElement): SignalElement {
        return new SignalElement(id, null, lines, lineType, SignalType.SIMPLE, text, actor, actor);
    }

    private constructor(
        readonly id: number,
        readonly line: Line,
        readonly lines: Line[], // empty unless signal==self
        readonly lineType: LineType,
        readonly signalType: SignalType,
        readonly text: Text,
        readonly actorA: ActorElement,
        readonly actorB: ActorElement
    ) {}

    svgElements(): Element[] {

        const elements: Element[] = [
            this.text
        ];

        if(this.lines.length > 0) {
            elements.push(...this.lines);
        } else {
            elements.push(this.line);
        }

        return elements;
    }

    toSameActor(): boolean {
        return this.actorA.actor.name === this.actorB.actor.name; 
    }

    getLineX(): [number, number] {
        if(this.lines && this.lines.length > 0) {
            return [this.lines[0].bbox().x, this.text.bbox().x2];
        }
        
        if(this.line) {
            return [this.line.bbox().x, this.line.bbox().x2];
        }

        // TODO error handling
        return [0, 0];
    }

    getLineY(): [number, number] {
        if(this.lines && this.lines.length > 0) {
            return [this.lines[0].bbox().y, this.lines[this.lines.length-1].bbox().y];
        }
        
        if(this.line) {
            return [this.line.bbox().y, this.line.bbox().y];
        }

        // TODO error handling
        return [0, 0];
    }

    toString(): string {
        const toSelf = this.actorA.actor.name === this.actorB.actor.name;
        
        if(toSelf === true) {
            return `Self-Signal #${this.id} '${this.actorA.actor.name}': '${this.text.text()}'`;
        } else {
            return `Signal from #${this.id} '${this.actorA.actor.name}' to '${this.actorB.actor.name}': '${this.text.text()}'`;
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
    CENTERED,
    TITLE
}

export class Dimensions {

    /* X and Y padding of the whole SVG */
    static SVG_PADDING = 10;

    /* Height of title bar */
    static TITLE_HEIGHT = 25;

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