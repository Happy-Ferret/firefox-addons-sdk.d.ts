/// <reference path="node.d.ts"/>
declare module "linestream" {

    import stream = require('stream');

    export = LineStream;

    class LineStream extends stream.Writable {
        constructor(options?: stream.WritableOptions);
        _write(chunk: NodeBuffer, enc: string, cb: Function): void;
        _write(chunk: string, enc: string, cb: Function): void;
    }
}