/// <reference path="../ts.d/node.d.ts"/>
/// <reference path="../ts.d/linestream.d.ts"/>

// @class, @constructor, @method, @property, @prop, @event
import fs = require('fs');
import path = require('path');

import LineStream = require('linestream');

import FileProcessor = require('./fileprocessor');

var fileNamesToHandle: string[] = [],
    sdkPath = path.resolve(process.argv.slice(-1).pop()),
    apiStart = /^<api\s+name="([^"]+)">$/,
    apiEnd = /^<\/api>$/,
    param = /^@param\s+(\w+)\s+\{([^}]+)\}$/,
    optParam = /^@param\s+\[(\w+)(?:="([^"]+)")?\]\s+\{([^}]+)\}$/,
    property = /^@property\s+\{([^}]+)\}$/,
    prop = /^\s+@prop\s+(\w+)\s+\{([^}]+)\}$/,
    optProp = /^\s+@prop\s+\[(\w+)(?:="([^"]+)")?\]\s+\{([^}]+)\}$/,
    apiKind = /^@(class|constructor|method)$/;


process.on('message', (msg) => {
    switch(msg.type) {
        case "errand":
            handleErrand(msg.fileName);
            break;
        case "start-processing":
            handleStartProcessing();
            break;
        default:
            process.send('worker-result', {
                err: 'Unknown message type: ' + msg.type
            });
    }
});

/**
 * Extracts and returns module name for its ambient declaration from given
 * full file name. If fails to extract module name, returns null.
 */
function moduleNameFromFileName(fileName: string): string {
    var modName: string = fileName.split(sdkPath).pop();

    if(!modName) {
        return null;
    }

    modName = fileName.replace('\\', '/');
    // Loose leading '/' and .md'
    if(path.extname(modName).toLowerCase() !== '.md') {
        return null;
    } else {
        modName = modName.substr(0, modName.length - 3);
    }

    if(modName[0] === '/') {
        modName = modName.slice(1);
    }

    return modName;
}

function handleErrand(fileName: string): void {
    if(fileName && fileName.trim()) {
        fileNamesToHandle.push(fileName);
    }
}

function handleStartProcessing(): void {
    fileNamesToHandle.forEach(processFile);
}

function processFile(fileName: string): void {
    var ls: LineStream = new LineStream(),
        is: fs.ReadStream = fs.createReadStream(fileName),
        readErrors: string[] = [],
        moduleName = moduleNameFromFileName(fileName),
        fileProcessor = new FileProcessor(moduleName);

    ls.on('lines', (lines: string[]) => {
        lines.forEach((line: string) => {
            var match;

            if(match = apiStart.exec(line)) {
                fileProcessor.apiStart(match[1]);
            } else if(apiEnd.test(line)) {
                fileProcessor.apiEnd();
            } else if(match = param.exec(line)) {
                fileProcessor.param.apply(fileProcessor, match.slice(1));
            } else if(match = optParam.exec(line)) {
                fileProcessor.optParam.apply(fileProcessor, match.slice(1));
            } else if(match = property.exec(line)) {
                fileProcessor.property(match[1]);
            } else if(match = prop.exec(line)) {
                fileProcessor.prop.apply(fileProcessor, match.slice(1));
            } else if(match = optProp.exec(line)) {
                fileProcessor.optProp.apply(fileProcessor, match.slice(1));
            } else if(match = apiKind.exec(line)) {
                fileProcessor[match[1] + 'Def']();
            }
        });
    }).on('error', (err: string) => {
        readErrors.push(err);
    }).on('finish', () => {
        var errors: string,
            processingErrors: string[] = fileProcessor.errors();

        if(readErrors.length > 0 || processingErrors.length > 0) {
            errors = 'Enrountered ' + readErrors.length + ' and ' +
                     processingErrors.length + ' while processing input file ' +
                     fileName;
        }

        process.send('worker-result', {
            err: errors,
            result: fileProcessor.generate()
        });
    });

    is.pipe(ls);
}