import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// @route GET /api/notifications
// @desc Get user notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.notification.count({ where: { userId } });

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// @route POST /api/notifications/:notificationId/read
// @desc Mark notification as read
router.post(
  '/:notificationId/read',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      const userId = req.userId;

      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      if (notification.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  }
);

export default router;
