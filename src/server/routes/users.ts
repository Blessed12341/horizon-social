import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// @route GET /api/users/:username
// @desc Get user profile
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            videos: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// @route POST /api/users/:userId/follow
// @desc Follow a user
router.post(
  '/:userId/follow',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const followerId = req.userId;

      if (userId === followerId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followerId!,
            followingId: userId,
          },
        },
      });

      if (existingFollow) {
        return res.status(400).json({ error: 'Already following this user' });
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: followerId!,
          followingId: userId,
        },
      });

      // Update follower count
      await prisma.profile.update({
        where: { userId },
        data: { followerCount: { increment: 1 } },
      });

      await prisma.profile.update({
        where: { userId: followerId! },
        data: { followingCount: { increment: 1 } },
      });

      res.json({ message: 'User followed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }
);

// @route POST /api/users/:userId/unfollow
// @desc Unfollow a user
router.post(
  '/:userId/unfollow',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const followerId = req.userId;

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followerId!,
            followingId: userId,
          },
        },
      });

      if (!follow) {
        return res.status(400).json({ error: 'Not following this user' });
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: followerId!,
            followingId: userId,
          },
        },
      });

      // Update follower count
      await prisma.profile.update({
        where: { userId },
        data: { followerCount: { decrement: 1 } },
      });

      await prisma.profile.update({
        where: { userId: followerId! },
        data: { followingCount: { decrement: 1 } },
      });

      res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }
);

// @route PUT /api/users/profile
// @desc Update user profile
router.put(
  '/profile',
  authenticate,
  [
    body('bio').optional().trim().escape(),
    body('website').optional().isURL(),
    body('location').optional().trim().escape(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bio, website, location, avatar, coverPhoto } = req.body;
      const userId = req.userId;

      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...(bio && { bio }),
          ...(website && { website }),
          ...(location && { location }),
          ...(avatar && { avatar }),
          ...(coverPhoto && { coverPhoto }),
        },
        include: { user: true },
      });

      res.json({
        message: 'Profile updated successfully',
        profile,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// @route GET /api/users/:username/followers
// @desc Get user followers
router.get('/:username/followers', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          include: { profile: true },
        },
      },
    });

    res.json({ followers: followers.map((f) => f.follower) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// @route GET /api/users/:username/following
// @desc Get user following
router.get('/:username/following', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          include: { profile: true },
        },
      },
    });

    res.json({ following: following.map((f) => f.following) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

export default router;
