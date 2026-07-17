import { Router, Request, Response } from 'express';
import { AccessToken } from 'livekit';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Generate LiveKit token
const generateLiveKitToken = (identity: string, roomName: string, canPublish: boolean = true) => {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY || 'key',
    process.env.LIVEKIT_API_SECRET || 'secret'
  );

  at.identity = identity;
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canPublishData: true,
    canSubscribe: true,
  });

  return at.toJwt();
};

// @route POST /api/livestreams
// @desc Create a livestream
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, description, startTime } = req.body;
    const userId = req.userId;

    const livestream = await prisma.livestream.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        userId: userId!,
        liveKitRoomName: `room-${Date.now()}`,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    res.status(201).json({
      message: 'Livestream created successfully',
      livestream,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create livestream' });
  }
});

// @route POST /api/livestreams/:livestreamId/start
// @desc Start a livestream
router.post(
  '/:livestreamId/start',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { livestreamId } = req.params;
      const userId = req.userId;

      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
      });

      if (!livestream) {
        return res.status(404).json({ error: 'Livestream not found' });
      }

      if (livestream.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updatedLivestream = await prisma.livestream.update({
        where: { id: livestreamId },
        data: { status: 'live' },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      // Generate LiveKit token for host
      const token = generateLiveKitToken(
        userId!,
        livestream.liveKitRoomName!,
        true
      );

      res.json({
        message: 'Livestream started',
        livestream: updatedLivestream,
        liveKitUrl: process.env.LIVEKIT_URL,
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to start livestream' });
    }
  }
);

// @route POST /api/livestreams/:livestreamId/join
// @desc Join a livestream as a viewer
router.post(
  '/:livestreamId/join',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { livestreamId } = req.params;
      const userId = req.userId;

      const livestream = await prisma.livestream.findUnique({
        where: { id: livestreamId },
      });

      if (!livestream) {
        return res.status(404).json({ error: 'Livestream not found' });
      }

      // Add viewer
      await prisma.livestreamViewer.create({
        data: {
          livestreamId,
          userId: userId!,
        },
      }).catch(() => {
        // Viewer already exists, ignore
      });

      // Increment viewer count
      await prisma.livestream.update({
        where: { id: livestreamId },
        data: { viewerCount: { increment: 1 } },
      });

      // Generate LiveKit token for viewer
      const token = generateLiveKitToken(
        userId!,
        livestream.liveKitRoomName!,
        false
      );

      res.json({
        message: 'Joined livestream',
        liveKitUrl: process.env.LIVEKIT_URL,
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to join livestream' });
    }
  }
);

// @route GET /api/livestreams
// @desc Get all livestreams
router.get('/', async (req: Request, res: Response) => {
  try {
    const livestreams = await prisma.livestream.findMany({
      where: { status: 'live' },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ livestreams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch livestreams' });
  }
});

// @route POST /api/livestreams/:livestreamId/chat
// @desc Send a chat message in livestream
router.post(
  '/:livestreamId/chat',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { livestreamId } = req.params;
      const { message, reaction } = req.body;
      const userId = req.userId;

      const chat = await prisma.livestreamChat.create({
        data: {
          livestreamId,
          userId: userId!,
          message: message || '',
          reaction: reaction || undefined,
        },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      res.status(201).json({
        message: 'Chat message sent',
        chat,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to send chat message' });
    }
  }
);

export default router;
