/// <reference path="node.d.ts"/>
declare module 'memory-streams' {

    import stream = require('stream');

    class WritableStream extends stream.Writable {
        toString(): string;
        toBuffer(): NodeBuffer;
    }
}