import { Injectable } from '@nestjs/common';
import { QwenPromptEnhancerService } from './qwen-prompt-enhancer.service';

@Injectable()
export class GeminiPromptEnhancerService extends QwenPromptEnhancerService {}
export { QwenPromptEnhancerService };
