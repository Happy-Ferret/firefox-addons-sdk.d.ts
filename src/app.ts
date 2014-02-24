/// <reference path="../ts.d/node.d.ts"/>
export = AsdkTypedApp;

import fs = require('fs');
import event = require('events');
import os = require('os');
import cluster = require('cluster');
import path = require('path');

/**
 *
 */
class AsdkTypedApp extends event.EventEmitter {
    private running: boolean = false;
    private nextWorker: number = 0;
    private pendingItems: number = 0; // Items, pending processing
    private outputFile: number = -1;

    /**
     * Initializes the instance with given SDK path, output path,
     * number of worker processes, and a timeout (in milliseconds) to start
     * those workers up.
     */
    constructor(private sdkpath: string,
                private outpath: string,
                private workers: number = os.cpus.length,
                private workersOnlineTimeoutMs: number = 1000) {
        super();

        if(!fs.existsSync(this.sdkpath)) {
            throw "'" + this.sdkpath + "' does not exist";
        }

        this.on('start-processing', this.process.bind(this));
    }

    run(): void {
        var onlineWorkers: number = 0;

        if(this.running) {
            return;
        }

        cluster.setupMaster({
            exec: './js/worker.js',
            args: [this.sdkpath],
            silent: true
        });

        setTimeout(() => {
            if(onlineWorkers > 0) {
                // At least some came up online, continuing then
                this.emit('start-processing');
            } else {
                this.emit('end', {type: 'error', data: 'Failed to start workers'});
            }
        }, this.workersOnlineTimeoutMs);

        cluster.on('online', () => ++onlineWorkers);
        cluster.on('disconnect', (w) => {
            --onlineWorkers;
            if(onlineWorkers <= 0) {
                this.emit('end', {type: 'error', data: 'All workers exited.'});
            }
        });

        // Spawn workers
        for(var i = 0; i < this.workers; ++i) {
            cluster.fork().on('worker-result',
                              this.workerReturnedResult.bind(this));
        }
    }

    private process(): void {
        // Open/create output file
        fs.open(this.outpath, 'w', (err, fd) => {
            if(err) {
                this.emit('end', {
                    type: 'error',
                    data: 'Failed to open output file: ' + this.outpath
                });

                return;
            }

            this.outputFile = fd;
            this.processDir(this.sdkpath);
        });

        // Signal workers to start processing
        Object.keys(cluster.workers).forEach((id) => cluster.workers[id].send({
            type: 'start-processing'
        }));
    }

    private processDir(dir: string): void {
        fs.readdir(dir, (err, files) => {
            var i: number, fullName: string;

            if(err) {
                this.emit('error', {data: err});
                return;
            }

            for(i = 0; i < files.length; ++i) {
                fullName = path.resolve(dir, files[i]);
                fs.stat(fullName, (err, stats) => {
                    if(stats.isDirectory()) {
                        this.processDir(fullName);
                        return;
                    }

                    ++this.pendingItems;
                    this.getWorker().send({type: 'errand', fileName: fullName});
                });
            }
        });
    }

    private workerReturnedResult(result: {err: string; result: NodeBuffer}): void {
        --this.pendingItems;

        if(result.err) {
            this.emit('error', {data: 'Worker returned error: ' + result.err});
        } else {
            fs.writeSync(this.outputFile, result.result, 0,
                         result.result.length, null);
        }


        if(this.pendingItems <= 0) {
            fs.closeSync(this.outputFile);
            this.emit('end');
        }
    }

    private getWorker(): cluster.Worker {
        var workerIds = Object.keys(cluster.workers);

        if(this.nextWorker >= workerIds.length) {
            this.nextWorker = 0;
        }

        return cluster.workers[this.nextWorker++];
    }
}