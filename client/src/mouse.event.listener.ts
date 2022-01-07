import { EventDispatcher } from './event.dispatcher';

export interface MouseEventObject {
    type: MouseEventCode,
    x: number,
    y: number,
}

export enum MouseEventCode {
    CLICK = 'click',
    DRAG_START = 'dragStart',
    DRAG_END = 'dragEnd',
    DRAG = 'drag',
}

export class MouseEventListener extends EventDispatcher {

    private _isStart: boolean = false;
    private _isDraging: boolean = false;

    constructor(dom: HTMLElement) {
        super();
        dom.addEventListener('mousedown', this._down);
        dom.addEventListener('mouseup', this._up);
        dom.addEventListener('mousemove', this._move);
    }

    private _down = (evt: MouseEvent) => {
        if(this._isStart) return;
        this._isStart = true;
    }

    private _up = (evt: MouseEvent) => {
        if(!this._isStart) return;
        const t: Date = new Date();
        if(this._isDraging) {
            this.fire(MouseEventCode.DRAG_END, { type: MouseEventCode.DRAG_END, x: evt.offsetX, y: evt.offsetY });
            this._isDraging = false;
            this._isStart = false;
        } else {
            if(evt.movementX == 0 && evt.movementY == 0) {
                this.fire(MouseEventCode.CLICK, { type: MouseEventCode.CLICK, x: evt.offsetX, y: evt.offsetY });
                this._isStart = false;
            }
        }
    }

    private _move = (evt: MouseEvent) => {
        if(!this._isStart) return;
        const t: Date = new Date();
        if(evt.movementX != 0 || evt.movementY != 0) {
            if(!this._isDraging) {
                this._isDraging = true;
                this.fire(MouseEventCode.DRAG_START, { type: MouseEventCode.DRAG_START, x: evt.offsetX, y: evt.offsetY });
            } else {
                this.fire(MouseEventCode.DRAG, { type: MouseEventCode.DRAG, x: evt.offsetX, y: evt.offsetY });
            }
        }
    }

}