/// <reference path="../ts.d/node.d.ts"/>

import stream = require('stream');

/**
 * @class
 * BufferStream implements stream.Writable such that the output is accumulated
 * in memory until reclaimed with @{link #toBuffer}.
 */
 export class BufferStream extends stream.Writable {
    /**
     * Obtains Buffer object, filled with data, previously written to this
     * stream. Then releases memory, purging locally accumulated data. Returns
     * buffer object, containing the data.
     */
    toBuffer(): NodeBuffer {
        var buffer = this.buffer;

        this.buffers.length = 0; // Release memory

        return buffer;
    }

    /**
     * @property {Buffer}
     * @returns a new Buffer object, filled with data, written to this stream.
     */
    get buffer(): NodeBuffer {
        var i: number = 0,
            buffer: NodeBuffer = new Buffer(this.sizeBytes),
            offset: number = 0;

        for(i = 0; i < this.buffers.length; ++i) {
            this.buffers[i].copy(buffer, offset);
            offset += this.buffers[i].length;
        }

        return buffer;
    }

    /**
     * @returns currently help size of data in bytes.
     */
    get length(): number {
        return this.sizeBytes;
    }

    //------------------------------------------------- Supertype implementation
    _write(data: any, encoding: string, callback: Function): void {
        if(typeof data === 'string') {
            data = new Buffer(data, encoding);
        }

        this.buffers.push(data);
        this.sizeBytes += data.length;

        callback(null);
    }


    //---------------------------------------------------------- Private members
    private sizeBytes: number = 0;
    private buffers: NodeBuffer[] = [];
 }