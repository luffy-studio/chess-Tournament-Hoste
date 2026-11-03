import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Schemas
const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username or email must be at least 3 characters')
    .max(50, 'Username or email cannot exceed 50 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'participant']).default('admin'),
});

const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a signed JWT.
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  const username = req.body.username.trim();
  const password = req.body.password;

  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      // Default admin bootstrap for initial empty database
      if (username === 'admin' && password === 'chess2025') {
        const hashedPassword = await bcrypt.hash('chess2025', 10);
        const adminUser = await prisma.user.create({
          data: {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
          },
        });

        const token = jwt.sign(
          { id: adminUser.id, username: adminUser.username, role: 'admin' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '1d' }
        );
        return res.json({ token, role: 'admin', id: adminUser.id, username: adminUser.username });
      }
    } else {
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
          );
          return res.json({ token, role: user.role, id: user.id, username: user.username });
        }
      }
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Allows administrators to securely register accounts.
 * Issues signed JWT token immediately for seamless onboarding.
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  const username = req.body.username.trim();
  const password = req.body.password;
  const role = req.body.role || 'admin';

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new AppError(
        'An account with this username or email already exists. Please choose another or sign in.',
        409,
        'USERNAME_TAKEN'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'participant',
      },
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      token,
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      message: 'Arbiter account successfully registered.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates a cryptographically secure 10-minute single-use password reset token.
 * Stores the SHA-256 hash of the token in the database.
 */
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res, next) => {
  const { username } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    // If user does not exist, return a generic message to prevent username enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that username exists, a password reset token has been generated.',
      });
    }

    // Invalidate any existing unused reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate 32-byte cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Exactly 10 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        used: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated. Valid for 10 minutes.',
      resetToken: rawToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Validates the single-use reset token, checks expiration (10 min), and updates password.
 * Invalidates token after successful use.
 */
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new AppError('Invalid or expired password reset token.', 400, 'INVALID_RESET_TOKEN');
    }

    if (resetRecord.used) {
      throw new AppError('This password reset token has already been used.', 400, 'TOKEN_ALREADY_USED');
    }

    if (new Date() > resetRecord.expiresAt) {
      // Mark as used to prevent future retries
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
      throw new AppError('Password reset token has expired. Please request a new token.', 400, 'TOKEN_EXPIRED');
    }

    // Hash new password with bcrypt salt rounds: 10
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and invalidate all active tokens for this user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { used: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Allows authenticated users to change their own password.
 */
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  try {
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      throw new AppError('Current password is incorrect', 400, 'INCORRECT_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
