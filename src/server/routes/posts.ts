import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// @route POST /api/posts
// @desc Create a new post
router.post(
  '/',
  authenticate,
  [
    body('content').trim().escape(),
    body('image').optional(),
    body('video').optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, image, video } = req.body;
      const userId = req.userId;

      if (!content && !image && !video) {
        return res.status(400).json({ error: 'Post must have content, image, or video' });
      }

      const post = await prisma.post.create({
        data: {
          content,
          image,
          video,
          userId: userId!,
        },
        include: {
          user: {
            include: { profile: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });

      res.status(201).json({
        message: 'Post created successfully',
        post,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// @route GET /api/posts/feed
// @desc Get user feed
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const posts = await prisma.post.findMany({
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

    const total = await prisma.post.count();

    res.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// @route GET /api/posts/:postId
// @desc Get a single post
router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          include: { profile: true },
        },
        comments: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// @route POST /api/posts/:postId/like
// @desc Like a post
router.post('/:postId/like', authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId!,
          postId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this post' });
    }

    await prisma.like.create({
      data: {
        userId: userId!,
        postId,
      },
    });

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// @route POST /api/posts/:postId/unlike
// @desc Unlike a post
router.post('/:postId/unlike', authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId!,
          postId,
        },
      },
    });

    if (!like) {
      return res.status(400).json({ error: 'Not liked this post' });
    }

    await prisma.like.delete({
      where: {
        userId_postId: {
          userId: userId!,
          postId,
        },
      },
    });

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// @route POST /api/posts/:postId/comment
// @desc Comment on a post
router.post(
  '/:postId/comment',
  authenticate,
  [body('content').trim().escape()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.userId;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          userId: userId!,
        },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      res.status(201).json({
        message: 'Comment created successfully',
        comment,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

// @route DELETE /api/posts/:postId
// @desc Delete a post
router.delete('/:postId', authenticate, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.post.delete({ where: { id: postId } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
