import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// @route GET /api/messages/conversations
// @desc Get user conversations
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const conversations = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { include: { profile: true } },
        receiver: { include: { profile: true } },
      },
    });

    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// @route GET /api/messages/:userId
// @desc Get conversation with a user
router.get('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { profile: true } },
        receiver: { include: { profile: true } },
      },
    });

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        receiverId: currentUserId,
        senderId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// @route POST /api/messages
// @desc Send a message
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { receiverId, content, image, video, voiceNote } = req.body;
    const senderId = req.userId;

    const message = await prisma.directMessage.create({
      data: {
        senderId: senderId!,
        receiverId,
        content,
        image,
        video,
        voiceNote,
      },
      include: {
        sender: { include: { profile: true } },
        receiver: { include: { profile: true } },
      },
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
