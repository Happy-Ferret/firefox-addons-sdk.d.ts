import bufstream = require('../bufferstream');
import Definition = require('../definition');

import PropertyDef = require('./property');
import ClassDef = require('./class');
import FunctionDef = require('./function');
import ConstructorDef = require('./constructor');
import MethodDef = require('./method');
import PropDef = require('./prop');
import ParamDef = require('./param');


export = CompoundDef;

/**
 * @class
 * Supertype for compound definitions
 */
interface CompoundDef extends Definition {
    /**
     * Implementation method for Definition.generate(): NodeBuffer and
     * Definition.generate(stream.Writable): void overloads.
     */
    generate(ostr?: stream.Writable): any {

        if(!ostr) {
            ostr = new bufstream.BufferStream();
        }

        this.generateHeader(ostr);
        this.generateContent(ostr);
        this.generateTrailer(ostr);

        return ostr.toBuffer();
    }

    (api: string, name?: string, initVal?: string, type?: string): void {
        if(this.nested) {
            this.nested.apply(this.nested, arguments);
            return;
        }

        this[api].apply(this, arguments);
    }

    start(name: string): void {
        if(!this.apiName) {
            // Local definition is to follow
            this.apiName = name;
            return;
        }

        this.end();
    }

    end(): void {
        if(this.nested) {
            definitions.push(this.nested);
            this.nested = null;
        }

        this.apiName = null;
    }

    property(type: string): void {
        this.nested = new PropertyDef(this.apiName, type);
    }

    prop(name: string, type: string): void {
        this.definitions.push(new PropDef(name, type));
    }

    optprop(name: string, initVal: string, type: string) {
        this.definitions.push(new PropDef(name, initVal, type));
    }

    param(name: string, type: string): void {
        this.definitions.push(new ParamDef(name, type));
    }

    optparam(name: string, initVal: string, type: string) {
        this.definitions.push(new ParamDef(name, initVal, type));
    }

    def(kind: string): void {
        this.nested = CompoundDef.factories[kind](this.apiName);
    }


    generateHeader(ostr: stream.Writable): void;
    generateTrailer(ostr: stream.Writable): void;
    generateContent(ostr: stream.Writable): void {
        var i = 0;
        for(i = 0; i < this.definitions.length; ++i) {
            this.definitions.generate(ostr);
        }
    }

    //---------------------------------------------------------- Private members
    private definitions: Definition[] = [];
    private nested: Definition;
    private apiName: string;

    private static factories = {
        'class': (name: string) => new ClassDef(name),
        'function': (name: string) => new FunctionDef(name),
        'constructor': (name: string, type?: string) => new ConstructorDef(name, type),
        'method': (name: string) => new MethodDef(name)
    };
}