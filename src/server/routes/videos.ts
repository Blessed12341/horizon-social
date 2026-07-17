import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = Router();

// @route POST /api/videos
// @desc Upload a video
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration, isShort } = req.body;
    const userId = req.userId;

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration: parseInt(duration),
        isShort: isShort || false,
        userId: userId!,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// @route GET /api/videos/shorts
// @desc Get short-form videos (TikTok-style)
router.get('/shorts', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const videos = await prisma.video.findMany({
      where: { isShort: true },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { profile: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    const total = await prisma.video.count({ where: { isShort: true } });

    res.json({
      videos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// @route GET /api/videos/:videoId
// @desc Get video details
router.get('/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    // Increment view count
    const video = await prisma.video.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
      include: {
        user: {
          include: { profile: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    res.json({ video });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

export default router;
