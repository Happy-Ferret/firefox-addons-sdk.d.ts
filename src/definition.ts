/// <reference path="../ts.d/node.d.ts"/>
import stream = require('stream');

export = Definition;

/**
 * @class
 * Declares a protocol for processing abstract definition, to be implemented by
 * concrete ones.
 */
interface Definition {

    generate(): NodeBuffer;
    generate(ostr: stream.Writable): void;

    (api: 'start', name: string): void;
    (api: 'end'): void;
    (api: 'param', name: string, type: string): void;
    (api: 'optparam', name: string, initVal: string, type: string): void;
    (api: 'property', type: string): void;
    (api: 'prop', name: string, type: string): void;
    (api: 'optprop', name: string, initVal: string, type: string): void;
    (api: 'def', name: string): void;
    (api: string, name?: string, initVal?: string, type?: string): void;
}
