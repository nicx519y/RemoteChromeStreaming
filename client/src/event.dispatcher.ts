export class EventDispatcher {

    private _handers: Map<any, Function[]> = new Map();

    constructor() {

    }

    public on(type: any, handler: Function): EventDispatcher {
        if(!this._handers.has(type)) {
            this._handers.set(type, []);
        }

        this._handers.get(type)?.push(handler);
        return this;
    }

    public off(type: any, handler: Function): EventDispatcher {
        if(this._handers.has(type)) {
            const idx: number | undefined = this._handers.get(type)?.findIndex(v  => v == handler);
            if(idx != undefined && idx >= 0) {
                this._handers.get(type)?.splice(idx, 1);
            }
        }
        return this;
    }

    public offAll(type: any): EventDispatcher {
        if(this._handers.has(type)) {
            this._handers.set(type, []);
        }
        return this;
    }

    public fire(type: any, data?: any): EventDispatcher {
        if(this._handers.has(type)) {
            this._handers.get(type)?.forEach(v => v(data));
        }
        return this;
    }
}