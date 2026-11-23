# Production Deployment Guide

This document outlines strategies for deploying **AI Image & Video Studio** to production environments (AWS, GCP, DigitalOcean, or Kubernetes).

---

## 1. Containerized Deployment with Docker Compose

For a single-server production deployment (e.g., AWS EC2, DigitalOcean Droplet, Hetzner):

1. Clone the repository on your production server.
2. Create a production `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Update `GOOGLE_GEMINI_API_KEY`, secure database passwords, and your production domain in `.env`.
4. Run the full production stack:
   ```bash
   docker compose up -d --build
   ```

Services started:
- `backend`: NestJS production Node container
- `frontend`: High-performance Nginx container serving compiled static assets and reverse-proxying `/api`
- `mysql`: Production MySQL 8.0 with persistent volume
- `redis`: Redis 7 container for queue orchestration
- `minio`: S3-compatible media object storage

---

## 2. AWS Cloud Architecture

For enterprise scale:

```
[CloudFront CDN]
       │
   [ALB Load Balancer]
    ├── /api/* ──> [ECS Fargate NestJS API Cluster] ──> [AWS RDS MySQL Multi-AZ]
    │                                               ──> [AWS ElastiCache Redis]
    │                                               ──> [AWS S3 Media Bucket]
    │                                               ──> [Google Gemini API]
    └── /* ──────> [S3 Static Frontend / Nginx]
```

### AWS S3 Object Storage Configuration
1. Create an S3 Bucket: `studio-media-production`.
2. Configure IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`.
3. Set environment variables:
   ```env
   S3_BUCKET=studio-media-production
   S3_REGION=us-east-1
   S3_ACCESS_KEY=AKIA...
   S3_SECRET_KEY=wJalrXUtn...
   S3_PUBLIC_URL=https://d12345.cloudfront.net
   ```

---

## 3. High Concurrency Video Queue Scaling

Video synthesis tasks are CPU and network intensive. For high traffic:
1. Run dedicated worker instances by starting the NestJS application with `PROCESS_TYPE=worker`.
2. Configure BullMQ worker concurrency in `videos.processor.ts`:
   ```typescript
   @Processor('video-generation-queue', { concurrency: 5 })
   ```
3. Monitor queue backlog via Redis or the Admin Dashboard at `/admin`.

---

## 4. Security & Production Checklist

- [x] Change all default passwords (`JWT_SECRET`, `JWT_REFRESH_SECRET`, MySQL root password).
- [x] Store `GOOGLE_GEMINI_API_KEY` in AWS Secrets Manager or GCP Secret Manager.
- [x] Enable SSL/TLS with Let's Encrypt or AWS ACM.
- [x] Set `NODE_ENV=production`.
- [x] Configure CORS to allow only your production frontend origin.
- [x] Configure daily automated database backups with MySQL dump or RDS automated snapshots.
