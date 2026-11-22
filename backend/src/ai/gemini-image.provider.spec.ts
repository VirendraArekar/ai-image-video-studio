import { Test, TestingModule } from '@nestjs/testing';
import { GeminiImageProvider } from './gemini-image.provider';

describe('GeminiImageProvider', () => {
  let provider: GeminiImageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiImageProvider],
    }).compile();

    provider = module.get<GeminiImageProvider>(GeminiImageProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should generate valid image output in fallback mode', async () => {
    const output = await provider.generateImage({
      prompt: 'A majestic cybernetic falcon over mountains',
      modelId: 'gemini-nano-banana-2.1',
      aspectRatio: '16:9',
      stylePreset: 'Cinematic',
    });

    expect(output).toBeDefined();
    expect(output.base64Data).toBeDefined();
    expect(output.base64Data.length).toBeGreaterThan(100);
    expect(output.mimeType).toBeDefined();
  });

  it('should support conversational editing actions with reference images', async () => {
    const fakeBase64 = Buffer.from('fake-pixel-data').toString('base64');
    const output = await provider.generateImage({
      prompt: 'Replace background with deep space nebula',
      modelId: 'gemini-nano-banana-2.1',
      referenceImageBase64: fakeBase64,
      referenceImageMime: 'image/png',
      editAction: 'REPLACE_BG',
    });

    expect(output).toBeDefined();
    expect(output.base64Data).toBeDefined();
  });
});
