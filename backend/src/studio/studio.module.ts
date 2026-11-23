import { Module } from '@nestjs/common';
import { StudioController } from './studio.controller';
import { StudioService } from './studio.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [StudioController],
  providers: [StudioService],
  exports: [StudioService],
})
export class StudioModule {}
