import { Injectable } from '@nestjs/common';
import { QwenVideoProvider } from './qwen-video.provider';

@Injectable()
export class GeminiVideoProvider extends QwenVideoProvider {}
export { QwenVideoProvider };
