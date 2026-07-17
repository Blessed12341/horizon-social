import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper function to generate tokens
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route POST /api/auth/register
// @desc Register a new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 30 }).trim().escape(),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          profile: {
            create: {},
          },
        },
        include: { profile: true },
      });

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'email-verification' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);

      const token = generateToken(user.id);

      res.status(201).json({
        message: 'User registered successfully. Check your email to verify.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// @route POST /api/auth/login
// @desc Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          profile: user.profile,
        },
        token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// @route POST /api/auth/verify-email
// @desc Verify user email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    if (decoded.type !== 'email-verification') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { emailVerified: new Date() },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Email verification failed' });
  }
});

// @route POST /api/auth/forgot-password
// @desc Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send reset link' });
  }
});

// @route POST /api/auth/reset-password
// @desc Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Password reset failed' });
  }
});

// @route POST /api/auth/me
// @desc Get current user
router.post('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
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

export default router;
