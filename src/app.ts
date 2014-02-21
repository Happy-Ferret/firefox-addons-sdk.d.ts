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

        this.on('start-processing', () => this.processDir(this.sdkpath));
    }

    run(): void {
        var onlineWorkers: number = 0;

        if(this.running) {
            return;
        }

        cluster.setupMaster({
            exec: './js/worker.js',
            silent: true
        });

        setTimeout(() => {
            if(onlineWorkers > 0) {
                // At least some came up online, continuing then
                this.emit('start-processing');
            } else {
                this.emit('error', 'Failed to start workers');
            }
        }, this.workersOnlineTimeoutMs);

        cluster.on('online', () => ++onlineWorkers);

        // Spawn workers
        for(var i = 0; i < this.workers; ++i) {
            cluster.fork();
        }
    }

    private processDir(dir: string): void {
        fs.readdir(dir, (err, files) => {
            var i: number, fullName: string;

            if(err) {
                this.emit('error', err);
                return;
            }

            for(i = 0; i < files.length; ++i) {
                fullName = path.join(dir, files[i]);
                fs.stat(fullName, (err, stats) => {
                    if(stats.isDirectory()) {
                        this.processDir(fullName);
                        return;
                    }

                    this.getWorker().send({fileName: fullName});
                });
            }
        });
    }

    private getWorker(): cluster.Worker {
        var workerIds = Object.keys(cluster.workers);

        if(this.nextWorker >= workerIds.length) {
            this.nextWorker = 0;
        }

        return cluster.workers[this.nextWorker++];
    }
}