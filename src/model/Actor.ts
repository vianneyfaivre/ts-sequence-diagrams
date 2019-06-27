export default class Actor {

    name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString() {
        return this.name;
    }
}