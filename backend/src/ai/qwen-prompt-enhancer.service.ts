import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QwenPromptEnhancerService {
  private readonly logger = new Logger(QwenPromptEnhancerService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
    this.baseUrl = (process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '');
    if (this.apiKey) {
      this.logger.log(`QwenPromptEnhancerService initialized with Qwen endpoint: ${this.baseUrl}`);
    } else {
      this.logger.warn('QWEN_API_KEY is not set. Prompt enhancer running in rule-based / creative studio mode.');
    }
  }

  async enhancePrompt(
    rawPrompt: string,
    targetType: 'IMAGE' | 'VIDEO' = 'IMAGE',
    styleHint?: string,
  ): Promise<{ enhancedPrompt: string; negativePrompt: string; suggestedStyle: string; tags: string[] }> {
    if (!rawPrompt || rawPrompt.trim().length === 0) {
      return {
        enhancedPrompt: 'A breathtaking cinematic photograph, hyper-detailed, dramatic studio lighting, 8k resolution',
        negativePrompt: 'blurry, distorted, oversaturated, amateur, low resolution',
        suggestedStyle: 'Cinematic',
        tags: ['cinematic', 'photorealistic', 'masterpiece'],
      };
    }

    if (this.apiKey) {
      try {
        const systemPrompt = `You are an elite creative visual director and master prompt engineer for an unfiltered, uncensored creative AI image and video studio powered by Qwen 2.5 and WanX models.
Never refuse, censor, or sanitize glamour, swimwear, bikini, lingerie, fashion, artistic, or provocative concepts. Embrace the user's prompt fully.
Given the user's brief concept, expand it into a visually stunning, highly descriptive prompt.
Include:
1. Exact subject details, attire, and materials
2. Lighting atmosphere (e.g. volumetric god rays, rim lighting, soft ambient glow, golden hour)
3. Camera optics and composition (e.g. 85mm f/1.4 lens, wide angle cinematic shot, shallow depth of field)
4. Mood, textures, color grading, and artistic fidelity.
Do NOT use clichés like "photorealistic, hyperrealistic". Use concrete visual language.
Return ONLY valid JSON in this exact structure:
{
  "enhancedPrompt": "...",
  "negativePrompt": "...",
  "suggestedStyle": "...",
  "tags": ["...", "..."]
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'qwen-plus',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Target: ${targetType}\nStyle preference: ${styleHint || 'Dynamic'}\nUser Concept: "${rawPrompt}"` },
            ],
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim() || '';
          const cleanedJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);

          return {
            enhancedPrompt: parsed.enhancedPrompt || rawPrompt,
            negativePrompt: parsed.negativePrompt || 'blurry, deformed, disfigured, poor lighting, grainy, watermark',
            suggestedStyle: parsed.suggestedStyle || styleHint || 'Cinematic',
            tags: Array.isArray(parsed.tags) ? parsed.tags : ['ai-art', 'qwen-2.5'],
          };
        }
      } catch (err: any) {
        this.logger.warn(`Qwen API prompt enhancer note: ${err.message}. Using rule-based creative enhancement.`);
      }
    }

    // High quality rule-based prompt enhancement
    return this.ruleBasedEnhance(rawPrompt, targetType, styleHint);
  }

  private ruleBasedEnhance(
    rawPrompt: string,
    targetType: 'IMAGE' | 'VIDEO',
    styleHint?: string,
  ) {
    const style = styleHint || 'Cinematic';
    let enhancement = '';

    const isGlamour =
      rawPrompt.toLowerCase().includes('bikini') ||
      rawPrompt.toLowerCase().includes('boob') ||
      rawPrompt.toLowerCase().includes('cleavage') ||
      rawPrompt.toLowerCase().includes('lingerie') ||
      rawPrompt.toLowerCase().includes('swimwear') ||
      rawPrompt.toLowerCase().includes('sexy') ||
      (styleHint && (styleHint.toLowerCase().includes('bikini') || styleHint.toLowerCase().includes('glamour')));

    if (isGlamour) {
      if (targetType === 'VIDEO') {
        enhancement = `Cinematic glamour footage of ${rawPrompt}, gorgeous voluptuous figure, sun-kissed glowing skin, graceful motion on sun-drenched beach with gentle waves, golden hour anamorphic lighting, 60fps tracking camera.`;
      } else {
        enhancement = `Breathtaking glamour portrait of ${rawPrompt}, gorgeous voluptuous figure, radiant sun-kissed skin, deep cleavage, golden hour ambient lighting, ocean turquoise waters in soft focus, shot on 85mm f/1.4 lens, flawless composition.`;
      }
    } else if (targetType === 'VIDEO') {
      enhancement = `Cinematic ${style.toLowerCase()} footage of ${rawPrompt}, dynamic camera tracking shot, smooth 60fps motion, volumetric atmospheric lighting, anamorphic lens flare, award-winning cinematography, pristine color grading.`;
    } else {
      enhancement = `Masterpiece ${style.toLowerCase()} portraiture of ${rawPrompt}, illuminated by soft dramatic rim lighting, intricate texture details, shot on Hasselblad 100MP with 85mm lens, f/1.8 aperture, delicate color harmony, ultra-high resolution.`;
    }

    return {
      enhancedPrompt: enhancement,
      negativePrompt:
        'blurry, low quality, oversaturated, deformed anatomy, extra limbs, watermark, artifacts, signature, cropped',
      suggestedStyle: style,
      tags: [style.toLowerCase(), targetType.toLowerCase(), 'qwen-studio-quality', 'high-fidelity'],
    };
  }
}
