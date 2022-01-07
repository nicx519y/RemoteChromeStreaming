var date = require("silly-datetime");

exports.CliParse = function(commandStr) {
    // Warnning(commandStr, typeof(commandStr));
    if(!commandStr || commandStr == '' || typeof(commandStr) != 'string') {
        return [];
    }
    return commandStr
        .replace(/\;\s*$/, '')
        .split(';')
        .map(v => v = v.trim())
        .map(str => {
            if(str == '') return null;
            try {
                const [ , signalId, command ] = /^(?:#([^\s]+)\s+)?([^-#\s]+)/.exec(str);
                if(!command) {
                    console.error('command is not found.');
                }
                const commandObj = { sign: signalId, command: command, args: {} };
                const argsReg = /-{2}([^-\s]+)(?:\s+([^\s]+))?/g;
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
            } catch(e) {
                Log('parse command fail.');
                return null;
            }
        });
}

exports.CliCreate = function(command, args) {
    
    let argsStr = '';

    for(key in args) {
        argsStr += `-${key} ${args[key]}`;
    }

    return `${command} ${argsStr}`;
}

function Log() {
    const d = new Date();
    const time = `[${date.format(d, 'HH:mm:ss')}:${d.getMilliseconds()}]`;
    const args = ['\033[40;35m' + time + '\033[40;37m', '\033[40;33m['+process.pid+']\033[40;37m'];
    for(i in arguments) {
        args.push(arguments[i]);
    }
    console.log.apply(null, args);
}

exports.Log = Log;

function Warnning() {
    const d = new Date();
    const time = `[${date.format(d, 'HH:mm:ss')}:${d.getMilliseconds()}]`;
    const args = ['\033[40;35m' + time + '\033[40;37m', '\033[40;33m['+process.pid+']\033[40;37m'];
    for(i in arguments) {
        args.push('\033[40;32m' + arguments[i] + '\033[40;37m');
    }
    console.error.apply(null, args);
}

exports.Warnning = Warnning;

