const { Log, Warnning } = require('./utils');

class ImageStreaming {
    lastFrame = null;
    constructor(stream, fps) {
        this._stream = stream;
        setInterval(this.ticker, 1000 / fps);
    }
    
    get stream() {
        return this._stream;
    }

    pushFrame(frame) {
        this.lastFrame = Buffer.from(frame, 'base64');
    }

    ticker = () => {
        if(this.lastFrame) {
            this._stream.write(this.lastFrame);
        }
    }
}

module.exports = ImageStreaming;