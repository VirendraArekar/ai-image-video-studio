import { Module } from '@nestjs/common';
import { ModelRegistryService } from './model-registry.service';
import { QwenImageProvider } from './qwen-image.provider';
import { QwenVideoProvider } from './qwen-video.provider';
import { QwenPromptEnhancerService } from './qwen-prompt-enhancer.service';
import { GeminiImageProvider } from './gemini-image.provider';
import { GeminiVideoProvider } from './gemini-video.provider';
import { GeminiPromptEnhancerService } from './gemini-prompt-enhancer.service';
import { GenerationOrchestratorService } from './generation-orchestrator.service';

@Module({
  providers: [
    ModelRegistryService,
    QwenImageProvider,
    QwenVideoProvider,
    QwenPromptEnhancerService,
    GeminiImageProvider,
    GeminiVideoProvider,
    GeminiPromptEnhancerService,
    GenerationOrchestratorService,
  ],
  exports: [
    ModelRegistryService,
    QwenImageProvider,
    QwenVideoProvider,
    QwenPromptEnhancerService,
    GeminiImageProvider,
    GeminiVideoProvider,
    GeminiPromptEnhancerService,
    GenerationOrchestratorService,
  ],
})
export class AiModule {}
