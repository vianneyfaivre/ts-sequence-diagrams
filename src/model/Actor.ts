export default class Actor {

    name: string;
    createdBySignal: boolean;

    constructor(name: string, createdBySignal: boolean) {
        this.name = name;
        this.createdBySignal = createdBySignal;
    }

    toString() {
        return this.name;
    }
}