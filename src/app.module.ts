import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrcestratorService } from './orcestrator/orcestrator.service';
import { OrcestratorModule } from './orcestrator/orcestrator.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          headers: {
            'Content-Type': 'application/json',
            'Access-Token': configService.get('ACCESS_TOKEN'),
          },
        };
      },
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    OrcestratorModule,
  ],
  controllers: [AppController],
  providers: [AppService, OrcestratorService],
})
export class AppModule {}
