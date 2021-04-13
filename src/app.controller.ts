import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('start')
  start() {
    console.log('Recieved start request');
    return this.appService.start();
  }

  @Post('stop')
  stop() {
    console.log('recieved stop request');
    return this.appService.stop();
  }
}
