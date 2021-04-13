import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrcestratorService } from './orcestrator.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [OrcestratorService],
  exports: [OrcestratorService],
})
export class OrcestratorModule {}
