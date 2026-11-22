import { Test, TestingModule } from '@nestjs/testing';
import { ModelRegistryService } from './model-registry.service';

describe('ModelRegistryService', () => {
  let service: ModelRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModelRegistryService],
    }).compile();

    service = module.get<ModelRegistryService>(ModelRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should retrieve all available models', () => {
    const models = service.getAllModels();
    expect(models.length).toBeGreaterThanOrEqual(6);
  });

  it('should filter image models properly', () => {
    const imageModels = service.getImageModels();
    expect(imageModels.every((m) => m.type === 'IMAGE')).toBe(true);
    expect(imageModels.some((m) => m.id === 'qwen-2.5-image-turbo')).toBe(true);
  });

  it('should filter video models properly', () => {
    const videoModels = service.getVideoModels();
    expect(videoModels.every((m) => m.type === 'VIDEO')).toBe(true);
    expect(videoModels.some((m) => m.id === 'qwen-wan2.1-video-turbo')).toBe(true);
  });

  it('should accurately calculate image credit costs with Qwen and legacy aliases', () => {
    const turboCost = service.calculateImageCreditCost('qwen-2.5-image-turbo', 1);
    expect(turboCost).toBe(1);

    const legacyCost = service.calculateImageCreditCost('gemini-nano-banana-2.1', 1);
    expect(legacyCost).toBe(1);

    const maxCost = service.calculateImageCreditCost('qwen-2.5-max-image', 2);
    expect(maxCost).toBe(4);
  });

  it('should dynamically calculate video credit costs based on resolution and duration', () => {
    const standardCost = service.calculateVideoCreditCost('qwen-wan2.1-video-turbo', 10, '720p');
    expect(standardCost).toBe(10);

    const legacyVideoCost = service.calculateVideoCreditCost('gemini-omni-1.2-flash', 10, '720p');
    expect(legacyVideoCost).toBe(10);

    const hdCost = service.calculateVideoCreditCost('qwen-wan2.1-video-turbo', 10, '1080p');
    expect(hdCost).toBe(15);

    const ultraCost = service.calculateVideoCreditCost('qwen-wan2.1-video-turbo', 15, '4k');
    expect(ultraCost).toBe(30);
  });
});
