import './css/index.css';
import JSMpeg from '@cycjimmy/jsmpeg-player';

const Config = {
    'SOCKET_URL': 'ws://localhost:8000',
    'VIDEO_URL': 'ws://localhost:9999',
    'PLAYER_WIDTH': 1280,
    'PLAYER_HEIGHT': 720,
}

export class Main {

    private _player: JSMpeg.Player;

    private _container: HTMLDivElement;
    private _canvas: HTMLCanvasElement;
    // private _profile: HTMLDivElement;
    private _toolsContainer: HTMLDivElement;
    private _backwardBtn: HTMLButtonElement;
    private _forwardBtn: HTMLButtonElement;

    private _ws: WebSocket;

    constructor() {
        this._container = document.createElement('div');
        this._canvas = document.createElement('canvas');
        // this._profile = document.createElement('div');
        this._toolsContainer = document.createElement('div');
        this._backwardBtn = document.createElement('button');
        this._forwardBtn = document.createElement('button');
        this._build();

        this._ws = new WebSocket(Config.SOCKET_URL);

        this._createPlayer(Config.VIDEO_URL, this._canvas);
    }

    private _build(): void {

        document.body.append(this._container);
        this._container.appendChild(this._canvas);
        this._container.setAttribute('class', 'container');
        
        // document.body.append(this._profile);
        // this._profile.setAttribute('class', 'profile');

        document.body.append(this._toolsContainer);
        this._toolsContainer.setAttribute('class', 'tools');
        this._toolsContainer.appendChild(this._backwardBtn);
        this._toolsContainer.appendChild(this._forwardBtn);
        this._forwardBtn.innerHTML = 'FORWARD >';
        this._backwardBtn.innerHTML = '< BACKWARD';
        this._forwardBtn.setAttribute('name', 'forward');
        this._backwardBtn.setAttribute('name', 'backward');

        this._canvas.addEventListener('mousedown', this._mouseActionHandler);
        this._canvas.addEventListener('mouseup', this._mouseActionHandler);
        this._canvas.addEventListener('mousemove', this._mouseActionHandler);
        this._canvas.addEventListener('wheel', this._wheelActionHandler);
        window.addEventListener('keydown', this._keyActionHandler);
        window.addEventListener('keyup', this._keyActionHandler);

        this._forwardBtn.addEventListener('click', this._toolsBtnHandler);
        this._backwardBtn.addEventListener('click', this._toolsBtnHandler);

    }

    private _createPlayer(wsUrl, canvas) {

        this._setCanvasSize(Config.PLAYER_WIDTH, Config.PLAYER_HEIGHT);

        this._player = new JSMpeg.Player(wsUrl, {
            canvas: canvas,
            autoplay: true,
            audio: false,
            video: true,
        });
        // this._player.play();
    }

    private _setCanvasSize(width, height) {
        this._container.style.width = width + 'px';
        this._canvas.style.width = width + 'px';
        this._canvas.style.height = height + 'px';
        this._canvas.setAttribute('width', width.toString());
        this._canvas.setAttribute('height', height.toString());

        const top: number = (window.innerHeight - this._canvas.clientHeight) / 2;
        this._container.style.marginTop = top + 'px';
    }

    private _mouseActionHandler = (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        const typeMap = {
            'mousedown': 'down',
            'mouseup': 'up',
            'mousemove': 'move',
        }
        if(evt.type in typeMap) {
            const type = typeMap[evt.type],
                x = evt.offsetX,
                y = evt.offsetY;
            // this._ws.send(`mouseEvent --type ${typeMap[evt.type]} --x ${evt.offsetX} --y ${evt.offsetY}; `);
            this._ws.send(JSON.stringify({
                command: 'mouseEvent',
                args: { type, x, y }
            }));
        }
    }

    private _toolsBtnHandler = (evt: MouseEvent) => {
        const type: string = (evt.target as HTMLButtonElement).name;
        this._ws.send(JSON.stringify({
            command: 'historyAction',
            args: { type }
        }));
    }

    private _wheelActionHandler = (evt: WheelEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        // this._ws.send(`wheel --x ${evt.offsetX} --y ${evt.offsetY} --deltaX ${evt.deltaX} --deltaY ${evt.deltaY};`);
        const x = evt.offsetX,
            y = evt.offsetY,
            deltaX = evt.deltaX,
            deltaY = evt.deltaY;
        this._ws.send(JSON.stringify({
            command: 'wheel',
            args: { x, y, deltaX, deltaY }
        }));
    }

    private _keyActionHandler = (evt: KeyboardEvent) => {
        evt.preventDefault();
        evt.stopPropagation();

        let type: string,
            modifiers: number,
            key: string,
            code: string,
            text: string,
            location: number = evt.location,
            nativeVirtualKeyCode: number = evt.keyCode,
            windowsVirtualKeyCode: number = evt.keyCode;
        
        type = { keydown: 'keyDown', keyup: 'keyUp' }[evt.type] || 'keyDown';
        key = evt.key;
        code = evt.code;
        text = (key.length == 1 ? key : 'null');

        if(evt.altKey) modifiers = 1;
        else if(evt.ctrlKey) modifiers = 2;
        else if(evt.metaKey) modifiers = 4;
        else if(evt.shiftKey) modifiers = 8;
        else modifiers = 0;

        // this._ws.send(`keyEvent --type ${type} --modifiers ${modifiers} --key ${key} --code ${code} --text ${text};`);
        this._ws.send(JSON.stringify({
            command: 'keyEvent',
            args: { type, modifiers, key, code, text, location, nativeVirtualKeyCode, windowsVirtualKeyCode }
        }));
    }

    // private _innerProfile = () => {
    //     const buffer = this._metaDataBuffer;
    //     const secondStart = buffer.findIndex(v => Date.now() - v.timestamp - v.delay <= 1000);
    //     let delay, FPS, bitRate;
    //     if(secondStart > -1) {
    //         const arr = buffer.slice(secondStart);
    //         delay = Math.round(arr.map(v => v.delay).reduce((prev, curr) => prev + curr) / arr.length);
    //         FPS = arr.length;
    //         bitRate = Math.round(arr.map(v => v.size).reduce((prev, curr) => prev + curr) / 1024 * 8);
    //     } else {
    //         delay = 0;
    //         FPS = 0;
    //         bitRate = 0;
    //     }

    //     let range = (Date.now() - buffer[0].timestamp) / 1000;
    //     let delayAvg = Math.round(buffer.map(v => v.delay).reduce((prev, curr) => prev + curr) / buffer.length);
    //     let FPSAvg = Math.round(buffer.length / range);
    //     let bitRateAvg = Math.round(buffer.map(v => v.size).reduce((prev, curr) => prev + curr) / 1024 * 8 / range);

    //     this._delayTop = Math.max(this._delayTop, delay);
    //     this._FPSTop = Math.max(this._FPSTop, FPS);
    //     this._bitRateTop = Math.max(this._bitRateTop, bitRate);

    //     this._profile.innerHTML = [
    //         `<span class="label" >FPS: </span> <span class="field" ><b>${FPS}</b></span>`,
    //         `<span class="label">BitRate: </span> <span class="field" ><b>${bitRate}</b> kbps</span>`,
    //         `<span class="label">Delay: </span> <span class="field" ><b>${delay} ms</b></span>`,
    //         `<span class="label">FPSAvg: </span> <span class="field" ><b>${FPSAvg}</b> </span>`,
    //         `<span class="label">BitRateAvg: </span> <span class="field" ><b>${bitRateAvg}</b> kbps</span>`,
    //         `<span class="label">DelayAvg: </span> <span class="field" ><b>${delayAvg} ms</b></span>`,
    //         `<span class="label">FPSTop: </span> <span class="field" ><b>${this._FPSTop}</b> </span>`,
    //         `<span class="label">BitRateTop: </span> <span class="field" ><b>${this._bitRateTop}</b> kbps</span>`,
    //         `<span class="label">DelayTop: </span> <span class="field" ><b>${this._delayTop} ms</b></span>`,
    //     ].join('');
    // }
}
window.onload = () => new Main();