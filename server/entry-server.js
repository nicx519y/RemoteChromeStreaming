const ws = require('nodejs-websocket');
const RtspStream = require('./node-rtsp-stream');
const spawn = require('child_process').spawn;
const { CliParse, CliCreate, Log, Warnning } = require('./utils');

const Config = {
    WINDOW_WIDTH: 1280,
    WINDOW_HEIGHT: 720,
    COMMAND_WS_PORT: 3100,
    VIDEO_WS_PORT: 3101,
    VIDEO_FPS: 30,
    // PAGE_URL: 'chrome://gpu',
    // PAGE_URL: 'http://naiteluo.cc/mondrian/index.html',
    PAGE_URL: 'https://weui.io/',
    // PAGE_URL: 'https://www.iqiyi.com/'
};

class EntryServer {

    ws;
    cdp;
    isReady = false;
    
    constructor() {
    }

    async run() {
        try {
            this.ws = this._createSocketServer();
            await this._createBrowserProcess();
            this.cdp = await this._createCDPProcess();
            this._createRtsp(this.cdp.stdout);
            this.isReady = true;
        }
        catch(e) {
            Warnning(e);
        }
    }

    _createBrowserProcess() {
        return new Promise((resolve, reject) => {
            const browser = spawn("/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome", [
                '--remote-debugging-port=9222',
                `--window-size=${Config.WINDOW_WIDTH},${Config.WINDOW_HEIGHT}`,
                '--headless',
                '--hide-scrollbars',
                ' --no-startup-window',
                '--mute-audio',
                '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
                '--use-gl=egl',
                // '--disable-gpu',
            ], {
                stdio: 'pipe',
                shell: false,
            });
            browser.on('spawn', () => resolve(browser));
        });
    }

    _createSocketServer() {
        const server = ws.createServer(conn => {
            conn.on('text', this._messageHandler);
            conn.on('close', code => {
                Log('关闭连接', code);
                this._disconnect(conn);
            });
            conn.on('error', code => {
                Log('异常关闭', code);
                this._disconnect(conn);
            });
        });
        server.on('connection', conn => this._connect(conn));
        server.listen(Config.COMMAND_WS_PORT);
        return server;
    }

    _createCDPProcess() {
        const worker = spawn('node', ['./cdp.js', Config.PAGE_URL, Config.VIDEO_FPS], {
            stdio: [ 'pipe', 'pipe', 'inherit' ]
        });
        worker.on('exit', code => Log(`CDP process exit, code: ${code}.`));

        return worker;
    }

    _createRtsp(input) {
        const rtsp = new RtspStream({
            name: 'rtsp',
            ffmpegPath: 'ffmpeg',
            inputStream: input,
            wsPort: Config.VIDEO_WS_PORT,
            ffmpegOptions: {
                '-s': `${Config.WINDOW_WIDTH}x${Config.WINDOW_HEIGHT}`,      //设置分辨率
                '-r': `${Config.VIDEO_FPS}`,
            }
        });
        return rtsp;
    }

    _messageHandler = text => {
        if(!this.isReady) return;
        this.cdp.stdin.write(text + '\n');
    }

    _connect(conn) {
        Log(`websocket connected.`);
        if(this.frameCacheLength > 0) {
            // send first frame data when connected
            if(this.frameCacheWriteBegin) {
                conn.beginBinary();
                conn.outStream.write(this.frameCache.slice(0, this.frameCacheLength));
            } else {
                conn.sendBinary(this.frameCache.slice(0, this.frameCacheLength));
            }
        }
    }

    _disconnect(conn) {
        Log('websocket disconnect.');
    }
}

// run
(() => {
    const s = new EntryServer();
    s.run();
})();


