/// <reference path="../ts.d/node.d.ts"/>

export interface Definition {
    generate(): NodeBuffer;

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

export class ClassDefinition implements Definition {

}