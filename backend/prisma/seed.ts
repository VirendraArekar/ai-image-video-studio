import { PrismaClient, Role, UserStatus, PlanTier, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AI Image & Video Studio database...');

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminSecret123!', salt);
  const creatorPasswordHash = await bcrypt.hash('Creator123!', salt);

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // 1. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aistudio.com' },
    update: {},
    create: {
      email: 'admin@aistudio.com',
      name: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminStudio',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Platform Root Administrator & Model Governance',
          defaultImageModel: 'qwen-2.5-image-turbo',
          defaultVideoModel: 'qwen-wan2.1-video-turbo',
        },
      },
      wallet: {
        create: {
          balance: 10000,
          lifetimeGranted: 10000,
          lifetimeSpent: 0,
          transactions: {
            create: {
              amount: 10000,
              balanceAfter: 10000,
              type: 'ADMIN_ADJUSTMENT',
              description: 'Initial Administrator Platform Credit Allocation',
            },
          },
        },
      },
      subscription: {
        create: {
          planTier: PlanTier.PRO_STUDIO,
          status: SubscriptionStatus.ACTIVE,
          monthlyCredits: 10000,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      },
      adminUser: {
        create: {
          permissions: {
            manageUsers: true,
            manageCredits: true,
            manageModels: true,
            viewAnalytics: true,
            moderateContent: true,
          },
        },
      },
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Seed Creator Demo User
  const creator = await prisma.user.upsert({
    where: { email: 'creator@aistudio.com' },
    update: {},
    create: {
      email: 'creator@aistudio.com',
      name: 'Elena Rostova',
      passwordHash: creatorPasswordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ElenaCreator',
      emailVerified: true,
      profile: {
        create: {
          bio: 'Digital artist, concept illustrator and AI cinematic storyteller',
          defaultImageModel: 'qwen-2.5-image-turbo',
          defaultVideoModel: 'qwen-wan2.1-video-turbo',
        },
      },
      wallet: {
        create: {
          balance: 350,
          lifetimeGranted: 350,
          lifetimeSpent: 50,
          transactions: {
            create: {
              amount: 350,
              balanceAfter: 350,
              type: 'SIGNUP_BONUS',
              description: 'Welcome Creator package allocation',
            },
          },
        },
      },
      subscription: {
        create: {
          planTier: PlanTier.CREATOR,
          status: SubscriptionStatus.ACTIVE,
          monthlyCredits: 1000,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      },
    },
  });
  console.log('Creator user seeded:', creator.email);

  // 3. Seed Model Configurations
  const modelsData = [
    {
      modelId: 'gemini-nano-banana-2.1',
      name: 'Gemini Nano Banana 2.1',
      provider: 'Google Gemini',
      mediaType: 'IMAGE' as const,
      baseCreditCost: 1,
      description: 'Default high-efficiency image generation & conversational editing with multi-reference fusion.',
      capabilities: { textToImage: true, inPainting: true, outPainting: true, editing: true },
      maxResolution: '1920x1080',
    },
    {
      modelId: 'gemini-3-pro-image',
      name: 'Gemini 3 Pro Image (Nano Banana Pro)',
      provider: 'Google Gemini',
      mediaType: 'IMAGE' as const,
      baseCreditCost: 2,
      description: 'Ultra-high fidelity flagship visual model for cinematic art and intricate details.',
      capabilities: { textToImage: true, inPainting: true, outPainting: true, editing: true },
      maxResolution: '2048x2048',
    },
    {
      modelId: 'gemini-3.1-flash-lite-image',
      name: 'Gemini 3.1 Flash-Lite Image',
      provider: 'Google Gemini',
      mediaType: 'IMAGE' as const,
      baseCreditCost: 1,
      description: 'Ultra-fast image generation for rapid concepting and social thumbnails.',
      capabilities: { textToImage: true, inPainting: false, outPainting: false, editing: false },
      maxResolution: '1024x1024',
    },
    {
      modelId: 'imagen-3.0-generate-002',
      name: 'Google Imagen 3',
      provider: 'Imagen',
      mediaType: 'IMAGE' as const,
      baseCreditCost: 2,
      description: 'Photorealistic synthesis with crisp typography and lighting comprehension.',
      capabilities: { textToImage: true, inPainting: false, outPainting: false, editing: false },
      maxResolution: '1024x1024',
    },
    {
      modelId: 'gemini-omni-1.2-flash',
      name: 'Gemini Omni 1.2 Flash Video',
      provider: 'Google Gemini',
      mediaType: 'VIDEO' as const,
      baseCreditCost: 10,
      description: 'Conversational 3s–15s video generation, keyframe transitions, audio, and extensions.',
      capabilities: { textToVideo: true, imageToVideo: true, keyframes: true, extensions: true },
      maxDuration: 15,
      maxResolution: '4k',
    },
    {
      modelId: 'veo-2.0-generate-001',
      name: 'Google Veo 2.0 Video',
      provider: 'Veo',
      mediaType: 'VIDEO' as const,
      baseCreditCost: 20,
      description: 'Cinematic physics-aware generative video model with realistic camera movements.',
      capabilities: { textToVideo: true, imageToVideo: true, keyframes: true, extensions: false },
      maxDuration: 10,
      maxResolution: '1080p',
    },
  ];

  for (const m of modelsData) {
    await prisma.modelConfig.upsert({
      where: { modelId: m.modelId },
      update: m,
      create: m,
    });
  }
  console.log('Model configs seeded');

  // 4. Seed Prompt Library Templates across 12 categories
  const templates = [
    {
      title: 'Nordic Sovereign Portrait',
      category: 'Realistic portraits',
      prompt: 'A close-up 85mm photograph of a Scandinavian warrior queen, weathered facial features, piercing sapphire eyes, subtle silver braided hair, illuminated by soft golden hour rim light and cool blue ambient shadows, atmospheric snow dust, 8k resolution, National Geographic portrait style',
      negativePrompt: 'blurry, plastic skin, deformed, cartoon, oversaturated, low quality',
      previewImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      tags: ['portrait', '85mm', 'warrior', 'golden-hour'],
    },
    {
      title: 'Blade Runner Neon Alleyway',
      category: 'Cinematic photography',
      prompt: 'Cinematic wide anamorphic shot of a rain-soaked futuristic Neo-Tokyo alleyway at night, brilliant magenta and cyan holographic neon signage reflecting in oily asphalt puddles, a solitary trenchcoat-clad detective standing under an umbrella, volumetric steam rising from street grates, Arri Alexa 65mm anamorphic flare',
      negativePrompt: 'grainy, low contrast, washed out, amateur, deformed',
      previewImageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
      tags: ['cinematic', 'cyberpunk', 'neon', 'anamorphic'],
    },
    {
      title: 'Haute Couture Silk Editorial',
      category: 'Fashion photography',
      prompt: 'High fashion editorial photography for Vogue, elegant model dressed in an architectural flowing emerald green silk gown with metallic copper accents, posing gracefully in a minimalist brutalist concrete courtyard, harsh afternoon sunlight creating bold geometric shadows, Hasselblad H6D-100c',
      negativePrompt: 'poorly dressed, distorted anatomy, messy hair, low resolution',
      previewImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
      tags: ['fashion', 'editorial', 'vogue', 'silk', 'brutalist'],
    },
    {
      title: 'Luxury Chronograph Floating Elements',
      category: 'Product photography',
      prompt: 'Commercial studio product shot of a luxury Swiss titanium automatic chronograph watch, suspended mid-air surrounded by micro water droplets and brushed carbon fiber shards, dark moody gradient studio background, razor sharp macro focus, pristine sapphire glass reflections, professional studio strobes',
      negativePrompt: 'scratched glass, dust, blurry dial, amateur lighting',
      previewImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      tags: ['product', 'watch', 'luxury', 'commercial', 'macro'],
    },
    {
      title: 'Biophilic Solar Sanctuary',
      category: 'Architecture',
      prompt: 'Architectural photography of a futuristic eco-villa cantilevered over a Norwegian fjord, organic curved timber beams integrated with lush hanging vertical gardens, floor-to-ceiling smart glass reflecting the serene Arctic sunset, warm interior lighting glowing through mist, Architectural Digest feature',
      negativePrompt: 'ugly building, pixelated, distorted perspective, blurry',
      previewImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      tags: ['architecture', 'biophilic', 'villa', 'norway', 'luxury'],
    },
    {
      title: 'Bioluminescent Cloud Forest',
      category: 'Nature',
      prompt: 'Wide mystical landscape of an ancient primeval temperate rainforest at twilight, massive moss-draped ancient redwood trees, glowing bioluminescent cyan mushrooms and floating golden spores illuminating an ethereal forest floor, gentle mountain stream whispering through ferns, National Geographic nature photograph of the year',
      negativePrompt: 'dry trees, burnt forest, oversaturated, low details',
      previewImageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=600&q=80',
      tags: ['nature', 'forest', 'bioluminescence', 'mystical'],
    },
    {
      title: 'Celestial Dragon of Astral Nebula',
      category: 'Fantasy',
      prompt: 'Epic digital fantasy concept art of a colossal cosmic dragon weaving through a shimmering spiral nebula, translucent scales made of starlight and obsidian crystal, celestial horns radiating aurora borealis ribbons, nebular clouds glowing in violet, indigo, and gold, Greg Rutkowski and Peter Mohrbacher style',
      negativePrompt: 'flat colors, poorly drawn anatomy, sketch, low detail',
      previewImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      tags: ['fantasy', 'dragon', 'space', 'nebula', 'cosmic'],
    },
    {
      title: 'Shinjuku Twilight Cafe Girl',
      category: 'Anime',
      prompt: 'Modern anime key visual of a girl with lavender hair sitting by a rainy cafe window overlooking a vibrant Tokyo street, warm incandescent cafe light contrasting against cool purple twilight outside, sipping hot matcha latte with latte art, Makoto Shinkai aesthetic, Kyoto Animation fidelity, ultra detailed background',
      negativePrompt: 'western cartoon, low quality line art, disfigured fingers, 3d render',
      previewImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      tags: ['anime', 'makoto-shinkai', 'tokyo', 'cafe', 'rain'],
    },
    {
      title: 'Futuristic Cybernetic Android Head',
      category: '3D artwork',
      prompt: 'Intricate 3D digital art of a transparent robotic android bust, showing glowing copper microprocessor pathways, exposed mechanical gears, frosted glass casing, soft studio raytracing, rendered in Octane Render and Cinema 4D, Behance trending, iridescent pearl reflections',
      negativePrompt: 'noisy render, low polygon, low texture resolution',
      previewImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      tags: ['3d', 'octane-render', 'robot', 'glass', 'cybernetic'],
    },
    {
      title: 'Electric Hypercar Commercial Launch',
      category: 'Advertising',
      prompt: 'Dynamic automotive commercial advertisement shot of a sleek matte carbon-fiber electric hypercar drifting through an illuminated dark concrete tunnel, sharp laser taillights tracing glowing crimson light ribbons, mist rising from warm Pirelli tires, bold corporate brand typography, Superbowl commercial aesthetic',
      negativePrompt: 'dented car, blurry wheels, bad reflection, toy car',
      previewImageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
      tags: ['advertising', 'automotive', 'hypercar', 'drift', 'commercial'],
    },
    {
      title: 'Viral Neon Food Photography',
      category: 'Social media',
      prompt: 'Eye-catching top-down viral Instagram food photograph of an artisan double smashed wagyu burger with melted smoked cheddar cascading over toasted brioche bun, surrounded by golden crinkle fries and truffle aioli, neon ambient accent lighting, rich saturated colors, sharp aperture f/2.8',
      negativePrompt: 'unappetizing food, cold burger, blurry shot, dirty table',
      previewImageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      tags: ['social-media', 'food', 'burger', 'instagram', 'mouthwatering'],
    },
    {
      title: 'Interstellar Rover Awakening',
      category: 'Video storytelling',
      prompt: 'Cinematic 10s video sequence: Camera starts as a macro shot of an exploration rover sensor turning on with an amber lens flare, slowly pulling back into a breathtaking wide panoramic view of an alien Martian landscape with twin moons rising over violet sand dunes, 60fps steady tracking movement',
      negativePrompt: 'jittery camera, low framerate, choppy motion, low resolution',
      previewImageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80',
      tags: ['video-storytelling', 'cinematic', 'sci-fi', 'mars', 'tracking-shot'],
    },
  ];

  for (const t of templates) {
    await prisma.promptTemplate.create({
      data: {
        title: t.title,
        category: t.category,
        prompt: t.prompt,
        negativePrompt: t.negativePrompt,
        previewImageUrl: t.previewImageUrl,
        tags: t.tags,
        isSystemDefault: true,
        usageCount: Math.floor(Math.random() * 80) + 20,
      },
    });
  }
  console.log(`Seeded ${templates.length} prompt templates across all 12 categories`);

  // 5. Seed Showcase Media for Gallery & Dashboard
  const showcaseData = [
    {
      userId: creator.id,
      mediaType: 'IMAGE' as const,
      storagePath: 'showcase/nordic_sovereign.jpg',
      publicUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=85',
      mimeType: 'image/jpeg',
      width: 1024,
      height: 1024,
      isFavourite: true,
      viewsCount: 412,
      downloadsCount: 89,
      prompt: 'A close-up 85mm photograph of a Scandinavian warrior queen, weathered facial features, piercing sapphire eyes, subtle silver braided hair, illuminated by soft golden hour rim light',
      modelId: 'gemini-3-pro-image',
    },
    {
      userId: creator.id,
      mediaType: 'IMAGE' as const,
      storagePath: 'showcase/cyberpunk_neon.jpg',
      publicUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85',
      mimeType: 'image/jpeg',
      width: 1280,
      height: 720,
      isFavourite: true,
      viewsCount: 654,
      downloadsCount: 120,
      prompt: 'Cinematic wide anamorphic shot of a rain-soaked futuristic Neo-Tokyo alleyway at night, brilliant magenta and cyan holographic neon signage',
      modelId: 'gemini-nano-banana-2.1',
    },
    {
      userId: creator.id,
      mediaType: 'VIDEO' as const,
      storagePath: 'showcase/interstellar_rover.mp4',
      publicUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      mimeType: 'video/mp4',
      durationSeconds: 10,
      isFavourite: true,
      viewsCount: 820,
      downloadsCount: 156,
      prompt: 'Cinematic 10s video sequence: Camera starts as a macro shot of an exploration rover sensor turning on with an amber lens flare, slowly pulling back into a panoramic Martian landscape',
      modelId: 'gemini-omni-1.2-flash',
    },
    {
      userId: creator.id,
      mediaType: 'IMAGE' as const,
      storagePath: 'showcase/biophilic_sanctuary.jpg',
      publicUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
      mimeType: 'image/jpeg',
      width: 1024,
      height: 1024,
      isFavourite: false,
      viewsCount: 298,
      downloadsCount: 44,
      prompt: 'Architectural photography of a futuristic eco-villa cantilevered over a Norwegian fjord, organic curved timber beams integrated with lush hanging vertical gardens',
      modelId: 'imagen-3.0-generate-002',
    },
  ];

  for (const item of showcaseData) {
    const job = await prisma.generationJob.create({
      data: {
        userId: item.userId,
        type: item.mediaType === 'IMAGE' ? 'IMAGE_TEXT_TO_IMAGE' : 'VIDEO_TEXT_TO_VIDEO',
        status: 'COMPLETED',
        modelId: item.modelId,
        prompt: item.prompt,
        creditCost: item.mediaType === 'IMAGE' ? 2 : 10,
        progress: 100,
        parameters: {
          create: {
            aspectRatio: item.width && item.height && item.width > item.height ? '16:9' : '1:1',
            resolution: '1080p',
          },
        },
      },
    });

    const media = await prisma.generatedMedia.create({
      data: {
        userId: item.userId,
        jobId: job.id,
        mediaType: item.mediaType,
        storagePath: item.storagePath,
        publicUrl: item.publicUrl,
        mimeType: item.mimeType,
        width: item.width,
        height: item.height,
        durationSeconds: item.durationSeconds,
        isFavourite: item.isFavourite,
        viewsCount: item.viewsCount,
        downloadsCount: item.downloadsCount,
        isPublic: true,
      },
    });

    if (item.isFavourite) {
      await prisma.favouriteMedia.create({
        data: {
          userId: item.userId,
          mediaId: media.id,
        },
      });
    }
  }

  console.log('Showcase media seeded successfully');
  console.log('Database seeding finished!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
