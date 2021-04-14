import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLIENT_RENEG_WINDOW } from 'node:tls';
import { Subject } from 'rxjs';

@Injectable()
export class OrcestratorService {
  serverURL = '';
  currentId = -1;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serverURL = this.configService.get('ORCESTRATOR_URL');
  }

  async sendServerInformation() {
    const body = {
      name: this.configService.get('NAME'),
      baseUri: this.configService.get('BASE_URI'),
    };

    try {
      await this.httpService
        .post(this.serverURL + 'server', body, { timeout: 1000 })
        .toPromise();
      console.log('Connected!');
    } catch (e: unknown) {
      console.log('Could not connect, trying again');

      const waitTillConnected = new Subject();

      setTimeout(async () => {
        await this.sendServerInformation();
        waitTillConnected.complete();
      }, 10000);

      await waitTillConnected.toPromise();
      return;
    }
  }

  async updateCurrentId() {
    const response = await this.httpService
      .get(
        this.serverURL + 'server' + `?name=${this.configService.get('NAME')}`,
      )
      .toPromise();

    this.currentId = response.data[0].id;
  }

  async notifyAvailable() {
    await this.httpService
      .post(`${this.serverURL}server/notAvailable/${this.currentId}`)
      .toPromise();
  }

  async notifyNotAvailable() {
    console.log(this.currentId);
    await this.httpService
      .post(`${this.serverURL}server/available/${this.currentId}`)
      .toPromise();
  }

  async notifyStopped() {
    await this.httpService
      .post(`${this.serverURL}server/stopComplete/${this.currentId}`)
      .toPromise();
  }

  notifyBooted() {
    this.httpService
      .get(`http://google.com:${this.configService.get('TRIGGER_PORT')}`)
      .toPromise()
      .catch();

    return this.httpService
      .post(`${this.serverURL}server/bootComplete/${this.currentId}`)
      .toPromise();
  }

  notifyStopping() {
    console.log();
  }
}
