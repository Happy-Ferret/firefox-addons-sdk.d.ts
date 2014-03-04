/// <reference path="../ts.d/node.d.ts"/>
import stream = require('stream');
import bufstream = require('./bufferstream');

/**
 * @class
 * Declares a protocol for processing abstract definition, to be implemented by
 * concrete ones.
 */
export interface Definition {

    generate(): NodeBuffer;
    generate(ostr: stream.Writable): void;

    errors(): string[];

    apiStart(name: string): void;
    apiEnd(): void;

    param(name: string, type: string): void;
    optParam(name: string, initVal: string, type: string): void;
    property(type: string): void;
    prop(name: string, type: string): void;
    optProp(name: string, initVal: string, type: string): void;

    classDef(): void;
    constructorDef(): void;
    methodDef(): void;
}

class CompoundDefinition implements Definition {
    definitions: Definition[] = [];
    nested: Definition;
    apiName: string;

    generate(): NodeBuffer {
        var ostr = new bufstream.BufferStream();

        this.generate(ostr);

        return ostr.toBuffer();
    }

    errors(): string[];

    apiStart(name: string): void {
        if(!this.apiName) {
            // Local definition is to follow
            this.apiName = name;
        } else {
            // Nested definition
            this.nested = new ForwardDefinition();
            this.nested.apiStart(name);
        }
    }

    apiEnd(): void {
        if(this.nested) {
            this.nested.apiEnd();
            definitions.push(this.nested);

            this.nested = null;
        }

        this.apiName = null;
    }

    param(name: string, type: string): void;
    optParam(name: string, initVal: string, type: string): void;
    property(type: string): void;
    prop(name: string, type: string): void;
    optProp(name: string, initVal: string, type: string): void;

    classDef(): void;
    constructorDef(): void;
    methodDef(): void;
}


export class ClassDefinition implements Definition {

}