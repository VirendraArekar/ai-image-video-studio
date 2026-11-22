import { Injectable } from '@nestjs/common';
import { QwenImageProvider } from './qwen-image.provider';

@Injectable()
export class GeminiImageProvider extends QwenImageProvider {}
export { QwenImageProvider };
