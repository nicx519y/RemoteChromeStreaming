const ws = require('nodejs-websocket');
const spawn = require('child_process').spawn;
const { CliParse, CliCreate, Log, Warnning } = require('./utils');

const Config = {
    WINDOW_WIDTH: 1280,
    WINDOW_HEIGHT: 720,
    FRAME_CACHE_MAX: 10 * 1024 * 1024,
    // PAGE_URL: 'http://naiteluo.cc/mondrian/index.html',
    PAGE_URL: 'https://weui.io/',
    // PAGE_URL: 'https://www.iqiyi.com/'
};

class EntryServer {

    port = 8000;
    ws;
    cdp;
    isReady = false;
    
    frameCache = Buffer.allocUnsafe(Config.FRAME_CACHE_MAX);
    frameCacheLength = 0;
    frameCacheWriteBegin = false;

    constructor(port) {
        this.port = port || 8000;
    }

    async run() {
        try {
            this.ws = this._createSocketServer();
            await this._createBrowserProcess();
            this.cdp = await this._createCDPProcess();
            this.cdp.stdout.on('data', this._reciveDataHandler);
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
                // '--use-skia-renderer',
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
        server.listen(this.port);
        return server;
    }

    _createCDPProcess() {
        const worker = spawn('node', ['./cdp.js', Config.PAGE_URL], {
            stdio: [ 'pipe', 'pipe', 'inherit' ]
        });
        worker.on('exit', code => Log(`CDP process exit, code: ${code}.`));

        return worker;
    }

    _reciveDataHandler = data => {

        const isStart = data.slice(0, 3).toString() == 'SOL';
        const isEnd = data.slice(-3).toString() == 'EOL';
        let buffer;

        if(isStart && !isEnd) {
            buffer = data.slice(3);
        } else if(!isStart && isEnd) {
            buffer = data.slice(0, -3);
        } else if(isStart && isEnd) {
            buffer = data.slice(3, -3);
        } else {    // !isStart && !isEnd
            buffer = data;
        }

        this._lastFrameCache(isStart, isEnd, buffer);
        this._frameDataCast(isStart, isEnd, buffer);
        
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

    _lastFrameCache(isStart, isEnd, buffer) {
        if(isStart) {
            this.frameCacheWriteBegin = true;
            this.frameCacheLength = 0;
        }

        if(this.frameCacheWriteBegin) {
            this.frameCache.fill(buffer, this.frameCacheLength, this.frameCacheLength + buffer.length);
            this.frameCacheLength += buffer.length;
        }

        if(isEnd) {
            this.frameCacheWriteBegin = false;
        }
    }

    _frameDataCast(isStart, isEnd, buffer) {
        this.ws.connections.forEach(conn => {
            if(isStart && !conn.outStream) {
                conn.beginBinary();
            }
            if(conn.outStream) {
                conn.outStream.write(buffer);
                if(isEnd) {
                    conn.outStream.end();
                }
            }
        });
    }
}

// run
(() => {
    const s = new EntryServer();
    s.run();
})();


