import moment from 'moment';

export function GenNonDuplicateID(randomLength): string{
    return Number(Math.random().toString().substr(3,randomLength) + Date.now()).toString(36)
}

export function CliParse(str) {
    try {
        const arr = /^(?:#([^\s]+)\s+)?([^-#\s]+)/.exec(str);
        if(arr && arr.length > 0) { 
            const signalId = arr[1];
            const command = arr[2];
            if(!command) {
                Wranning('command is not found.');
            }
            const commandObj = { sign: signalId, command: command, args: {} };
            const argsReg = /-([^-\s]+)(?:\s+([^-\s]+))?/g;
            let result;
            while(result = argsReg.exec(str)) {
                if(result[2] != undefined) {
                    commandObj.args[result[1]] = result[2];
                } else {
                    commandObj.args[result[1]] = true;
                }
            }
            // Log(`recive command line: ${str}.`);
            return commandObj;
        } else {
            Log('parse command fail.');
            return null;
        }
    } catch(e) {
        Log('parse command fail.');
        return null;
    }
}

export function Log(...args: any[]) {
    const d = new Date();
    args.unshift(`%c[${moment(d).format('HH:mm:ss')}:${d.getMilliseconds()}]`, 'color: grey; font-weight: bold;');
    console.log.apply(null, args);
}

export function Wranning(...args: any[]) {
    const d = new Date();
    args.unshift(`%c[${moment(d).format('HH:mm:ss')}:${d.getMilliseconds()}]`, 'color: grey; font-weight: bold;');
    console.warn.apply(null, args);
}

export function ReadAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        let reader: FileReader = new FileReader();
        reader.onload = e => {
            if(!e) {
                reject();
            } else {
                resolve(e.target?.result as string);
            }
        }
        reader.onerror = e => {
            reject(e);
        }
        reader.readAsText(blob);
    });
}

export function Base64ToBlob(base64Str, type): Blob {
    let bstr = window.atob(base64Str), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: type });
}

export function Read48Uint(dv: DataView, offset: number): number {
    const left = dv.getUint32(offset, true);
    const right = dv.getUint16(offset + 4, true);
    return left + right * Math.pow(4, 16);
}
