import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as proc from 'child_process';
import { spawn } from 'node:child_process';
import { Server } from 'node:http';
import { cwd } from 'node:process';
import { Observable, Subject } from 'rxjs';
import { OrcestratorService } from './orcestrator/orcestrator.service';

@Injectable()
export class AppService {
  mcProcess?: proc.ChildProcessWithoutNullStreams;

  booting = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly orcestrator: OrcestratorService,
  ) {}

  async onModuleInit() {
    await this.orcestrator.sendServerInformation();
    await this.orcestrator.notifyAvailable();

    const handleExit = async (exit: boolean) => {
      const allPromises = [this.orcestrator.notifyNotAvailable()];

      if (this.mcProcess) {
        await this.stop();
        allPromises.push(this.orcestrator.notifyStopped());
      }

      Promise.all(allPromises).then(() => {
        if (exit) process.exit();
      });
    };

    //do something when app is closing
    process.on('exit', handleExit.bind(null, { exit: false }));

    //catches ctrl+c event
    process.on('SIGINT', handleExit.bind(null, { exit: true }));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', handleExit.bind(null, { exit: true }));
    process.on('SIGUSR2', handleExit.bind(null, { exit: true }));

    //catches uncaught exceptions
    process.on('uncaughtException', handleExit.bind(null, { exit: true }));
  }

  async start() {
    if (this.mcProcess) {
      return;
    }

    console.log('starting!');
    const customArgs: string = this.configService.get('SERVER_ARGS').split(' ');

    const spawned = proc.spawn(
      'java',
      ['-jar', ...customArgs, this.configService.get('SERVER_FILE'), 'nogui'],
      {
        cwd: this.configService.get('SERVER_DIR'),
      },
    );

    this.mcProcess = spawned;

    spawned.stderr.on('data', (data: Buffer) => console.log(data.toString()));
    spawned.stdout.on('data', (data: Buffer) => {
      console.log(data.toString());
      if (data.toString().search(/Done \(/g) != -1) {
        this.booting = false;
        this.orcestrator.notifyBooted();
      }

      if (data.toString().search(/Stopping server/g) != -1) {
        this.orcestrator.notifyStopping();
      }
    });

    spawned.stderr.on('data', (data: Buffer) => {
      console.log(data.toString());
    });

    spawned.on('exit', () => {
      console.log('stopping!');
      this.orcestrator.notifyStopped();
      this.mcProcess = undefined;
    });

    spawned.on('data', (data) => {
      console.log(data);
    });
  }

  async stop() {
    if (!this.mcProcess) {
      return;
    }

    const a = new Observable((obs) => {
      console.log('obs created!');

      this.mcProcess.once('exit', () => {
        console.log('obs fired!');

        obs.next({ code: 0 });
        obs.complete();
      });
    });

    this.mcProcess.stdin.write('stop\n');

    await a.toPromise();
    console.log('server exitecd sucessfully!');
  }
}
