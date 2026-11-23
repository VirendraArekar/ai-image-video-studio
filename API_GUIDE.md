# REST API Guide & Reference

The **AI Image & Video Studio** backend exposes a comprehensive RESTful API documented interactively via Swagger UI at `http://localhost:3000/api/docs`.

---

## 1. Authentication Endpoints

### Register User
`POST /api/auth/register`
```json
{
  "email": "creator@example.com",
  "password": "Password123!",
  "name": "Jane Doe"
}
```
**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid-v4",
    "email": "creator@example.com",
    "name": "Jane Doe",
    "role": "USER",
    "wallet": {
      "balance": 50,
      "lifetimeGranted": 50
    }
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 3600
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "creator@example.com",
  "password": "Password123!"
}
```

### Refresh Token
`POST /api/auth/refresh`
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

---

## 2. AI Image Generation Endpoints

### List Available Image Models
`GET /api/images/models`

### Enhance Prompt with Gemini
`POST /api/images/enhance-prompt`
```json
{
  "prompt": "futuristic flying car",
  "targetType": "IMAGE",
  "styleHint": "Cinematic"
}
```
**Response (200 OK):**
```json
{
  "enhancedPrompt": "A sleek aerodynamic flying hypercar with iridescent carbon fiber body, hovering over neon-bathed wet skyscraper rooftops, volumetric god rays piercing storm clouds, 85mm anamorphic lens, Hasselblad 100MP clarity",
  "negativePrompt": "blurry, distorted anatomy, low resolution, watermark",
  "suggestedStyle": "Cinematic",
  "tags": ["cinematic", "photorealistic", "masterpiece"]
}
```

### Text-to-Image & Image-to-Image Generation
`POST /api/images/generate`
*Header: `Authorization: Bearer <JWT>`*
```json
{
  "prompt": "Nordic warrior in snow",
  "negativePrompt": "blurry, low quality",
  "modelId": "gemini-nano-banana-2.1",
  "aspectRatio": "16:9",
  "stylePreset": "Cinematic",
  "sampleCount": 1
}
```

### Conversational Image Editing
`POST /api/images/edit`
*Header: `Authorization: Bearer <JWT>`*
```json
{
  "prompt": "Replace background with Martian red dunes",
  "referenceImageBase64": "<base64>",
  "editAction": "REPLACE_BG",
  "modelId": "gemini-nano-banana-2.1"
}
```

---

## 3. AI Video Generation Endpoints

### Estimate Video Cost
`POST /api/videos/estimate-cost`
```json
{
  "modelId": "gemini-omni-1.2-flash",
  "duration": 10,
  "resolution": "720p"
}
```
**Response (200 OK):**
```json
{
  "modelId": "gemini-omni-1.2-flash",
  "duration": 10,
  "resolution": "720p",
  "estimatedCredits": 10
}
```

### Queue Asynchronous Video Generation
`POST /api/videos/generate`
*Header: `Authorization: Bearer <JWT>`*
```json
{
  "prompt": "Cinematic drone tracking shot over mountain stream",
  "modelId": "gemini-omni-1.2-flash",
  "duration": 10,
  "resolution": "720p",
  "aspectRatio": "16:9",
  "includeAudio": true
}
```
**Response (202 Accepted):**
```json
{
  "success": true,
  "jobId": "job-uuid",
  "status": "PENDING",
  "creditCost": 10,
  "message": "Video generation job queued. Track status at /api/videos/jobs/job-uuid"
}
```

### Poll Job Status
`GET /api/videos/jobs/:jobId`
**Response (200 OK):**
```json
{
  "id": "job-uuid",
  "status": "COMPLETED",
  "progress": 100,
  "creditCost": 10,
  "media": {
    "id": "media-uuid",
    "publicUrl": "http://localhost:3000/uploads/videos/...",
    "durationSeconds": 10
  }
}
```

---

## 4. Gallery & Creative Studio Endpoints

- `GET /api/gallery` - Browse paginated creations with filters (`mediaType`, `isFavourite`, `search`, `sortBy`)
- `GET /api/gallery/my-creations` - User's personal portfolio
- `POST /api/gallery/:id/favourite` - Toggle favourite
- `POST /api/gallery/:id/download` - Increment download telemetry
- `DELETE /api/gallery/:id` - Soft delete media
- `GET /api/studio/asset/:id` - Load asset with parameter inspector and variation lineage
- `POST /api/studio/variations` - Synthesize variation with adjusted prompt or seed

---

## 5. Credits & Billing Endpoints

- `GET /api/credits` - Get wallet balance, lifetime stats, and active subscription
- `GET /api/credits/transactions` - Paginated credit ledger
- `POST /api/credits/packages/purchase` - Buy Starter (200), Creator (600), or Pro (1,500) credit packs
- `POST /api/credits/subscription/upgrade` - Upgrade subscription tier (`STARTER`, `CREATOR`, `PRO_STUDIO`)

---

## 6. Admin Endpoints (`Role: ADMIN`)

- `GET /api/admin/analytics` - SaaS generation metrics, failure rate, and credit burn
- `GET /api/admin/users` - User list with search and credit details
- `POST /api/admin/users/:id/credits` - Manually grant or deduct credits with audit note
- `POST /api/admin/users/:id/status` - Suspend or activate user accounts
- `GET /api/admin/jobs` - Job queue monitor
- `GET /api/admin/audit-logs` - Immutable administrative audit logs
