/// <reference path="../ts.d/node.d.ts"/>
export = FileProcessor;

import definition = require('./definition');

class FileProcessor implements definition.Definition {

    constructor(private moduleName: string) {}

    //------------------------------------------------- Supertype implementation

    errors(): string[] {
        return [];
    }

    generate(): NodeBuffer {
        this.buffer.write("declare module \"", 'utf8');
        this.buffer.write(this.moduleName, 'utf8');
        this.buffer.write('" {\n', 'utf8');

        // TODO: add generating code for underlying heirarchy

        return this.buffer.toBuffer();
    }

    apiStart(name: string): void {
        if(this.curDef) {
            this.curDef.apiStart(name);
            return;
        }

        this.apiName = name;
    }

    apiEnd(): void {
        if(!this.curDef) {
            // Error
            return;
        }

        this.curDef.apiStart(name);
    }

    param(name: string, type: string): void {

    }

    optParam(name: string, initVal: string, type: string): void {

    }

    property(type: string): void {

    }

    prop(name: string, type: string): void {

    }

    optProp(name: string, initVal: string, type: string): void {

    }

    classDef(): void {

    }

    constructorDef(): void {

    }

    methodDef(): void {

    }


    //---------------------------------------------------------- Private members
}