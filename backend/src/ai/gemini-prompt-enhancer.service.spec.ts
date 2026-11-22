import { Test, TestingModule } from '@nestjs/testing';
import { GeminiPromptEnhancerService } from './gemini-prompt-enhancer.service';

describe('GeminiPromptEnhancerService', () => {
  let service: GeminiPromptEnhancerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiPromptEnhancerService],
    }).compile();

    service = module.get<GeminiPromptEnhancerService>(GeminiPromptEnhancerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should enrich a basic image prompt into high-detail description', async () => {
    const res = await service.enhancePrompt('cat drinking tea', 'IMAGE', 'Cinematic');
    expect(res).toBeDefined();
    expect(res.enhancedPrompt).toContain('cat drinking tea');
    expect(res.negativePrompt).toBeDefined();
    expect(res.suggestedStyle).toBe('Cinematic');
    expect(res.tags.length).toBeGreaterThan(0);
  });

  it('should provide dynamic video camera directions for video prompts', async () => {
    const res = await service.enhancePrompt('drone flying through neon city', 'VIDEO');
    expect(res).toBeDefined();
    expect(res.enhancedPrompt.toLowerCase()).toContain('camera');
    expect(res.enhancedPrompt.toLowerCase()).toContain('motion');
  });
});
