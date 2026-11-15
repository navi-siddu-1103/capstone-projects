import { Router } from 'express';
import mongoose from 'mongoose';
import { AccessToken } from 'livekit-server-sdk';
import { Course, Enrollment, Notification } from '../models.js';
import {
  requireAuth,
  allowRoles,
} from '../middleware/auth.js';

const router = Router();

// POST /api/live-classes/token
router.post(
  '/token',
  requireAuth,
  allowRoles('student', 'instructor', 'admin'),
  async (req, res) => {
    try {
      const { roomName } = req.body;

      if (
        typeof roomName !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(roomName)
      ) {
        return res.status(400).json({
          message: 'A valid room name is required',
        });
      }

      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      const serverUrl = process.env.LIVEKIT_URL;

      if (!apiKey || !apiSecret || !serverUrl) {
        return res.status(500).json({
          message: 'LiveKit environment variables are missing',
        });
      }

      const token = new AccessToken(apiKey, apiSecret, {
        identity: String(req.user.id),
        name: req.user.name,
      });

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      res.json({
        token: await token.toJwt(),
        serverUrl,
        roomName,
      });
    } catch (error) {
      console.error('LiveKit token error:', error);

      res.status(500).json({
        message: 'Failed to generate LiveKit token',
      });
    }
  }
);

// POST /api/live-classes/broadcast
// Allows an instructor/admin to create and broadcast a live class session
// to all students enrolled in the specified course.
router.post(
  '/broadcast',
  requireAuth,
  allowRoles('instructor', 'admin'),
  async (req, res) => {
    try {
      const { courseId, roomName, topic } = req.body;

      if (!courseId || !mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({
          message: 'A valid course ID is required',
        });
      }

      const sanitizedRoom = String(roomName || '').trim();
      if (!sanitizedRoom || !/^[a-zA-Z0-9_-]{1,100}$/.test(sanitizedRoom)) {
        return res.status(400).json({
          message:
            'A valid room code is required (1-100 characters, letters, numbers, hyphens, underscores)',
        });
      }

      // Check course ownership
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const isAllowed =
        req.user.role === 'admin' ||
        String(course.instructor) === String(req.user.id);

      if (!isAllowed) {
        return res.status(403).json({
          message: 'You can only broadcast live classes for your own courses',
        });
      }

      // Find all students enrolled in this course (excluding the instructor themselves)
      const enrollments = await Enrollment.find({ course: course._id }).select(
        'student'
      );

      const recipientIds = enrollments
        .map((e) => e.student)
        .filter(
          (studentId) =>
            studentId && String(studentId) !== String(req.user.id)
        );

      // Create notifications for enrolled students
      if (recipientIds.length > 0) {
        const topicSnippet = topic ? ` - Topic: ${String(topic).trim()}` : '';
        const notifications = recipientIds.map((studentId) => ({
          recipient: studentId,
          title: `🔴 Live Class: ${course.title}`,
          message: `${req.user.name} has started a live class for "${course.title}"${topicSnippet}. Room Code: ${sanitizedRoom}. Join now!`,
          type: 'live-class',
          link: sanitizedRoom,
        }));

        await Notification.insertMany(notifications);
      }

      return res.json({
        success: true,
        message: `Live class broadcast sent to ${recipientIds.length} enrolled student(s)`,
        notifiedCount: recipientIds.length,
        roomName: sanitizedRoom,
        courseTitle: course.title,
      });
    } catch (error) {
      console.error('Broadcast live class error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to broadcast live class',
      });
    }
  }
);

export default router;
