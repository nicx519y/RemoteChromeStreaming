const CDP = require('chrome-remote-interface');
const ImageStreaming = require('./image-stream');
const { Warnning } = require('./utils');

(async () => {

    const inputQueue = [];
    const fps = 24;

    const { Network, Page, Input ,Target } = client = await init();
    await Promise.all([Network.enable(), Page.enable() ]);
    
    client.on('error', () => Warnning('cdp error'));

    Warnning(`page will navigate to ${process.argv[2]}`);

    await Page.navigate({
        url: process.argv[2]    //URL
    });

    Warnning(`page loaded & will start screencast`);

    const imageStreaming = new ImageStreaming(process.stdout, fps);

    Page.on('screencastFrame', client => {
        const { data, metadata, sessionId } = client;
        imageStreaming.pushFrame(data);
        Page.screencastFrameAck({ sessionId });
    });

    Page.on('screencastVisibilityChanged', evt => {
        if(evt.visible == false) {
            Warnning(`Page with currently enabled screencast  was hidden.`);
        } else {
            Warnning(`Page with currently enabled screencast  was shown.`);
        }
    });

    await Page.startScreencast({
        format: 'jpeg',
        quality: 80,
        everyNthFrame: 1,
    });

    // consume input
    // (async function() {
    //     while(true) {
    //         if(inputQueue.length > 0) {
    //             inputDispatch(inputQueue.shift());
    //         } else {
    //             await new Promise(resolve => setTimeout(() => resolve(), 1));
    //         }
    //     }
    // })();

    process.stdin.on('data', data => {
        try {
            data.toString()
                .replace(/\\n$/, '')
                .split('\n')
                .filter(v => v != '')
                .map(v => JSON.parse(v))
                // .forEach(o => inputQueue.push(o));
                .forEach(o => inputDispatch(o));
            }
        catch(e) {
            Warnning(`parse input data failure: ${e}`);
        }
    });

    function init() {
        return CDP()
            .then(b => b)
            .catch(e => new Promise(resolve => setTimeout(() => resolve(arguments.callee()), 500)));
    }

    function mouseAction(type, x, y) {
        type = { down: 'mousePressed', up: 'mouseReleased', move: 'mouseMoved' }[type];
        x *= 1;
        y *= 1;
        let button, clickCount;
        if(type == 'mouseMoved') {
            button = 'none';
            clickCount = 0;
        } else {
            button = 'left';
            clickCount = 1;
        }
        return Input.dispatchMouseEvent({ type, x, y, button, clickCount });
    }

    function wheel(x, y, deltaX, deltaY) {
        x *= 1;
        y *= 1;
        deltaX *= 1;
        deltaY *= 1;
        return Input.dispatchMouseEvent({ type: 'mouseWheel', x, y, deltaX, deltaY });
    }

    async function navigateActionDispatch(type) {
        try {
            const { currentIndex, entries } = await Page.getNavigationHistory();
            let idx;
            if(type == 'forward') {
                if(currentIndex > entries.length - 2) return;
                idx = currentIndex + 1;
            } else if(type == 'backward') {
                if(currentIndex < 1) return;
                idx = currentIndex - 1;
            } else {
                return;
            }
            const entryId = entries[idx]['id'];
            return Page.navigateToHistoryEntry({ entryId });
        }
        catch(e) {
            Warnning(`navigate action failure. ${e}`);
            return;
        }
    }

    function keyActionDispatch(type, modifiers, code, key, text, location, nativeVirtualKeyCode, windowsVirtualKeyCode) {
        try {
            // Warnning(`will be dispatch key action: ${type} ${modifiers} ${code} ${key} ${text}. ${location}`);
            modifiers *= 1;
            location *= 1;
            text = text != 'null' ? text : ''; 
            let isSystemKey = true;
            let commands = [];

            /**
             * Editing commands to send with the key event (e.g., 'selectAll') (default: []). 
             * These are related to but not equal the command names used in document.execCommand 
             * and NSStandardKeyBindingResponding. See
             * https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/editing/commands/editor_command_names.h
             */
            const commandMap = {
                Backspace: 'DeleteBackward',
                Delete: 'DeleteForward',
                ArrowLeft: 'MoveBackward',
                ArrowRight: 'MoveForward',
                ArrowUp: 'MoveUp',
                ArrowDown: 'MoveDown',
            }

            const shiftCommandMap = {
                ArrowLeft: 'MoveBackwardAndModifySelection',
                ArrowRight: 'MoveForwardAndModifySelection',
                ArrowUp: 'MoveUpAndModifySelection',
                ArrowDown: 'MoveDownAndModifySelection',
            }

            const metaCommandMap = {
                ArrowLeft: 'MoveToBeginningOfLine',
                ArrowRight: 'MoveToEndOfLine',
                a: 'SelectAll',
                A: 'SelectAll',
            }

            if(type == 'keyDown') {
                if(modifiers == 0 && key in commandMap) {
                    commands.push(commandMap[key]);
                } else if(modifiers == 8 && key in shiftCommandMap) {
                    commands.push(shiftCommandMap[key]);
                } else if(modifiers == 4 && key in metaCommandMap) {
                    commands.push(metaCommandMap[key]);
                }
            }

            return Input.dispatchKeyEvent({ type, modifiers, code, key, isSystemKey, text, location, nativeVirtualKeyCode, windowsVirtualKeyCode, commands });
        }
        catch(e) {
            Warnning(`key action failure. ${e}`);
        }
    }

    function inputDispatch(inputObj) {
        // Warnning(`mouse event dispatch: ${JSON.stringify(inputObj)}`);
        const { command, args } = inputObj;
        switch(command) {
            case 'mouseEvent':
                return mouseAction(args.type, args.x, args.y);
                break;
            case 'historyAction':
                return navigateActionDispatch(args.type);
                break;
            case 'wheel':
                return wheel(args.x, args.y, args.deltaX, args.deltaY);
                break;
            case 'keyEvent':
                return keyActionDispatch(args.type, args.modifiers, args.code, args.key, args.text, args.location);
                break;
            default:
                break;
        }
    }

})();