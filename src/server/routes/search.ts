import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

// @route GET /api/search
// @desc Search users, posts, hashtags, videos, livestreams
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type = 'all' } = req.query;
    const query = (q as string)?.toLowerCase() || '';

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const results: any = {};

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { profile: true },
        take: 10,
      });
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
        },
        include: {
          user: { include: { profile: true } },
        },
        take: 10,
      });
    }

    if (type === 'all' || type === 'videos') {
      results.videos = await prisma.video.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { user: { include: { profile: true } } },
        take: 10,
      });
    }

    if (type === 'all' || type === 'livestreams') {
      results.livestreams = await prisma.livestream.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { user: { include: { profile: true } } },
        take: 10,
      });
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
