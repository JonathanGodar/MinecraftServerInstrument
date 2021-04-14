import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLIENT_RENEG_WINDOW } from 'node:tls';

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
    try {
      await this.httpService
        .post(this.serverURL + 'server', {
          name: this.configService.get('NAME'),
          baseUri: this.configService.get('BASE_URI'),
        })
        .toPromise()
        .catch();
    } catch (e) {}

    const response = await this.httpService
      .get(
        this.serverURL + 'server' + `?name=${this.configService.get('NAME')}`,
      )
      .toPromise();

    console.log(response.data);
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
