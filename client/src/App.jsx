import React, { useCallback, useEffect, useState, useRef } from 'react';

import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Video,
  Award,
  Search,
  Menu,
  PlayCircle,
  Users,
  ArrowRight,
  ShieldCheck,
  Bell,
  CheckCheck,
  Trash2,
  X,
  Clock,
  RefreshCw,
} from 'lucide-react';


import Hls from 'hls.js';

import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from '@livekit/components-react';

import '@livekit/components-styles';
import './certificates.css';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import LessonVideo from './components/LessonVideo';

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const API = (
  import.meta.env.VITE_API_URL || 'https://learning-management-system-live-classes-753172578941.asia-south1.run.app/api'
).replace(/\/$/, '');

// --------------------------------------------------
// DEMO COURSES
// Used when the backend is unavailable or returns
// an empty course list.
// --------------------------------------------------

const initialCourses = [
  {
    _id: 'demo1',
    title: 'Full-Stack Web Development',
    description:
      'Build modern web apps with React, Node.js, REST APIs, and databases.',
    category: 'Development',
    price: 0,
    instructor: { name: 'LearnLive Academy' },
    lessons: [
      { title: 'Getting started' },
      { title: 'Build your first API' },
    ],
  },
  {
    _id: 'demo2',
    title: 'Cloud & Deployment Essentials',
    description:
      'Understand cloud deployment, environment variables, and reliable releases.',
    category: 'Cloud',
    price: 499,
    instructor: { name: 'LearnLive Academy' },
    lessons: [{ title: 'Cloud fundamentals' }],
  },
  {
    _id: 'demo3',
    title: 'Java Backend Engineering',
    description:
      'Explore REST design, persistence, authentication, and production practices.',
    category: 'Backend',
    price: 299,
    instructor: { name: 'LearnLive Academy' },
    lessons: [{ title: 'REST principles' }],
  },
];

// --------------------------------------------------
// API REQUEST HELPER
// --------------------------------------------------

async function request(path, options = {}) {
  const token = localStorage.getItem('learnlive_token');

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the server at ${API}. Make sure the backend is running.`
    );
  }

  // Read the response safely, including non-JSON responses.
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// --------------------------------------------------
// COURSE RESPONSE NORMALIZATION
// --------------------------------------------------

function normalizeCourses(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.courses)) {
    return data.courses;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.courses)) {
    return data.data.courses;
  }

  return null;
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

export default function App() {
  const [courses, setCourses] = useState(initialCourses);

  const [user, setUser] = useState(null);
  const [page, setPage] = useState('Welcome');
  const [showSplash, setShowSplash] = useState(true);
  const [loginPortal, setLoginPortal] = useState('student');
  
  const [myCourses, setMyCourses] = useState([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [studentQuizAttempts, setStudentQuizAttempts] = useState([]);
  const [studentQuizLoading, setStudentQuizLoading] = useState(false);
  const [studentDashboardTab, setStudentDashboardTab] = useState('all');

  const [query, setQuery] = useState('');

  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionCourseId, setActionCourseId] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizCourseId, setQuizCourseId] = useState('');

  const [managedQuizzes, setManagedQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizDeletingId, setQuizDeletingId] = useState(null);

  const [instructorMetrics, setInstructorMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');

  const [studentPerformance, setStudentPerformance] = useState([]);
  const [studentPerformanceLoading, setStudentPerformanceLoading] = useState(false);
  const [studentPerformanceError, setStudentPerformanceError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminCourseSearch, setAdminCourseSearch] = useState('');

  const [adminCourseFilter, setAdminCourseFilter] = useState('all');
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState('all');
  const [selectedAdminCourse, setSelectedAdminCourse] = useState(null);
  const [adminCourseDetailsLoading, setAdminCourseDetailsLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [lessonsCourseLoading, setLessonsCourseLoading] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
  });

  const [lessonVideo, setLessonVideo] = useState(null);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [newLessonSaving, setNewLessonSaving] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingLessonForm, setEditingLessonForm] = useState({
    title: '',
    description: '',
  });
  const [editingLessonVideo, setEditingLessonVideo] = useState(null);


  const [newQuizQuestions, setNewQuizQuestions] = useState([
    {
      prompt: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      points: 1,
    },
  ]);


  const [quizSaving, setQuizSaving] = useState(false);
  const [auth, setAuth] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [isRegister, setIsRegister] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Development',
    price: 0,
  });
  const [liveRoomName, setLiveRoomName] = useState('');
  const [liveToken, setLiveToken] = useState('');
  const [liveServerUrl, setLiveServerUrl] = useState('');
  const [liveConnecting, setLiveConnecting] = useState(false);
  const [hostCourseId, setHostCourseId] = useState('');
  const [hostRoomName, setHostRoomName] = useState('');
  const [hostTopic, setHostTopic] = useState('');
  const [hostBroadcasting, setHostBroadcasting] = useState(false);

  // NOTIFICATIONS
  const flash = useCallback((message) => {
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => {
      setNotice('');
    }, 4500);

    return () => clearTimeout(timer);
  }, [notice]);

  // Show the branded splash screen briefly on initial app load.
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (page === 'My Learning' && user?.role === 'student') {
      setPage('Dashboard');
    }
    if (page === 'Dashboard' && user?.role === 'student') {
      loadMyLearning();
      loadStudentQuizAttempts();
    }
    if (
      page === 'Manage Course Lessons' &&
      (user?.role === 'instructor' || user?.role === 'admin')
    ) {
      loadInstructorCourses();
    }
    if (
      page === 'Quiz Management' &&
      (user?.role === 'instructor' || user?.role === 'admin')
    ) {
      loadManagedQuizzes();
    }
  }, [page, user?.role]);

  // RESTORE AUTHENTICATION & LOAD COURSES
  useEffect(() => {
    const token = localStorage.getItem('learnlive_token');

    // 1. Check session if token exists
    if (!token) {
      setAuthChecking(false);
    } else {
      request('/auth/me')
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            setPage(
              data.user.role === 'student'
                ? 'Explore'
                : data.user.role === 'admin'
                ? 'Admin Management'
                : 'Dashboard'
            );
          } else {
            localStorage.removeItem('learnlive_token');
            setUser(null);
          }
        })
        .catch((err) => {
          console.error('Session restoration failed:', err.message);
          localStorage.removeItem('learnlive_token');
          setUser(null);
        })
        .finally(() => {
          setAuthChecking(false);
        });
    }

    // 2. Load courses independently in the background
    request('/courses')
      .then((data) => {
        const result = normalizeCourses(data);
        if (result !== null && result.length > 0) {
          setCourses(result);
        }
      })
      .catch((error) => {
        console.error('Course loading failed:', error.message);
        setNotice(`Showing demo courses. Course API error: ${error.message}`);
      });
  }, []);

  const joinLiveClass = async (roomOverride) => {
    const targetRoom = (
      typeof roomOverride === 'string' ? roomOverride : liveRoomName
    ).trim();

    if (!targetRoom) {
      flash('Please enter a meeting code.');
      return;
    }
    setLiveConnecting(true);

    try {
      const data = await request('/live-classes/token', {
        method: 'POST',
        body: JSON.stringify({
          roomName: targetRoom,
        }),
      });

      setLiveRoomName(targetRoom);
      setLiveToken(data.token);
      setLiveServerUrl(data.serverUrl);
      setPage('Live Classes');
      setNotificationsOpen(false);
    } catch (error) {
      flash(error.message || 'Unable to join the live class.');
    } finally {
      setLiveConnecting(false);
    }
  };

  const broadcastAndStartLiveClass = async () => {
    if (!hostCourseId) {
      flash('Please select a course for the live class.');
      return;
    }
    const trimmedRoom = hostRoomName.trim();
    if (!trimmedRoom) {
      flash('Please enter or generate a meeting code.');
      return;
    }

    setHostBroadcasting(true);
    try {
      const data = await request('/live-classes/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          courseId: hostCourseId,
          roomName: trimmedRoom,
          topic: hostTopic.trim(),
        }),
      });

      flash(
        `Live session started! Sent invitation code to ${data.notifiedCount || 0} enrolled student(s).`
      );

      // Connect instructor directly as host
      await joinLiveClass(trimmedRoom);
    } catch (error) {
      flash(`Unable to broadcast live class: ${error.message}`);
    } finally {
      setHostBroadcasting(false);
    }
  };

  // LOGIN AND REGISTRATION
  async function submitAuth(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setNotice('');

    try {
      if (isRegister) {
        const targetRole = loginPortal === 'instructor' ? 'instructor' : 'student';
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: auth.name.trim(),
            email: auth.email.trim(),
            password: auth.password,
            role: targetRole,
          }),
        });

        setIsRegister(false);
        setPage('Sign in');

        setAuth((previous) => ({
          ...previous,
          password: '',
        }));

        flash(
          targetRole === 'instructor'
            ? 'Instructor account created successfully! Please sign in with your credentials.'
            : 'Student account created successfully! Please sign in with your credentials.'
        );
      } else {
        const data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: auth.email,
            password: auth.password,
            portal: loginPortal,
          }),
        });

        if (!data?.token || !data?.user) {
          throw new Error(
            'Login response is missing the user or authentication token.'
          );
        }
        // Save the token before updating the authenticated UI.
        localStorage.setItem('learnlive_token', data.token);
        setUser(data.user);

        // Route users to the workspace matching their verified role.
        setPage(
          data.user.role === 'student'
            ? 'Explore'
            : data.user.role === 'admin'
            ? 'Admin Management'
            : 'Dashboard'
        );

        setAuth((previous) => ({
          ...previous,
          password: '',
        }));

        flash(`Welcome back, ${data.user.name}!`);
      }
    } catch (error) {
      console.error('Authentication failed:', error);

      flash(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem('learnlive_token');

    setUser(null);
    setPage('Welcome');
    setLoginPortal('student');
    setIsRegister(false);

    setAuth({
      name: '',
      email: '',
      password: '',
      role: 'student',
    });

    flash('You have signed out successfully.');
  }

  // CREATE COURSE
  async function createCourse(event) {
    event.preventDefault();

    if (!user) {
      flash('Please sign in first.');
      return;
    }
    try {
      const data = await request('/courses', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const rawCourse = data?.course || data;

      if (!rawCourse?._id) {
        throw new Error(
          'The server did not return a valid course. Check the API response.'
        );
      }

      const course = {
        ...rawCourse,
        instructor: rawCourse.instructor?.name
          ? rawCourse.instructor
          : { _id: user.id || user._id, name: user.name },
      };

      setCourses((previous) => [course, ...previous]);
      setModal(false);
      setForm({
        title: '',
        description: '',
        category: 'Development',
        price: 0,
      });

      flash('Course published successfully.');
    } catch (error) {
      console.error('Course creation failed:', error);

      flash(`Unable to create course: ${error.message}`);
    }
  }

  async function uploadLessonVideo(file) {
    if (!file) {
      throw new Error('Please select a video file.');
    }

    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select an MP4, MOV, or WebM video.');
    }
    const token = localStorage.getItem('learnlive_token');

    if (!token) {
      throw new Error('Please sign in again before uploading.');
    }
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${API}/uploads/video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Video upload failed.');
    }
    const { jobId } = result;
    if (!jobId) {
      throw new Error('The server did not return a video-processing job ID.');
    }
    return { jobId, status: 'queued' };
  }

  // ENROLL IN COURSE
  async function enroll(course) {
    if (!user) {
      setPage('Welcome');
      flash('Please sign in to continue.');
      return;
    }

    const courseId = String(course._id || course.id || '');

    // Demo courses do not exist in MongoDB.
    if (courseId.startsWith('demo')) {
      flash('This is a demo course. Please use a course saved in the database.');
      return;
    }

    // Instructors and admins can open course details.
    if (user.role === 'instructor' || user.role === 'admin') {
      try {
        const data = await request(`/courses/${courseId}`);
        setSelectedCourse(data.course || data);
        setPage('Course Details');
      } catch (error) {
        console.error('Unable to open course:', error);
        flash(`Unable to open course: ${error.message}`);
      }
      return;
    }

    if (actionCourseId) return;


    setActionCourseId(courseId);


    try {


      await request(`/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      flash(`You have enrolled in ${course.title}.`);
      await loadMyLearning();
    } catch (error) {
      if (error.message?.toLowerCase().includes('already enrolled')) {
        setNotice('You are already enrolled in this course.');
        await loadMyLearning();
        return;
      }

      if (error.message?.toLowerCase().includes('payment')) {
        flash('Payment is required for this course.');
        return;
      }

      console.error('Enrollment failed:', error);
      setNotice(error.message || 'Failed to enroll in course.');
      flash(`Enrollment failed: ${error.message}`);
    } finally {
      setActionCourseId(null);
    }
  }

  async function openCourse(course) {
    if (!user) {
      setPage('Welcome');
      flash('Please sign in to continue.');
      return;
    }

    const courseId = String(course._id || course.id || '');
    if (!courseId || courseId.startsWith('demo')) {
      flash('Please select a course published in the database.');
      return;
    }

    try {
      const data = await request(`/courses/${courseId}`);
      const openedCourse = data.course || data;
      const lessonData = await request(`/courses/${courseId}/lessons`);
      openedCourse.lessons = lessonData.lessons || [];
      setSelectedCourse(openedCourse);
      setPage('Course Details');
    } catch (error) {
      console.error('Unable to open course:', error);
      flash(`Unable to open course: ${error.message}`);
    }
  }

  // BUY PAID COURSE WITH RAZORPAY
  async function buyCourse(course) {
    if (!user) {
      setPage('Welcome');
      flash('Please sign in before purchasing a course.');
      return;
    }

    if (user.role !== 'student') {
      flash('Only students can purchase courses.');
      return;
    }

    const courseId = String(course._id || course.id || '');

    if (!courseId || courseId.startsWith('demo')) {
      flash('Please select a course published in the database.');
      return;
    }

    if (Number(course.price || 0) <= 0) {
      flash('This is a free course. Use the free enrollment option.');
      return;
    }

    if (actionCourseId) return;

    setActionCourseId(courseId);

    try {
      // Load the Razorpay Checkout script if it isn't loaded already.
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const existingScript = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          );

          if (existingScript) {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener(
              'error',
              () => reject(new Error('Unable to load Razorpay Checkout.')),
              { once: true }
            );

            // Handle a script that has already finished loading.
            if (window.Razorpay) resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = () =>
            reject(new Error('Unable to load Razorpay Checkout.'));

          document.body.appendChild(script);
        });
      }

      // Ask the backend to create the order.
      const order = await request('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });

      if (!order?.orderId || !order?.keyId) {
        throw new Error('The server returned incomplete payment details.');
      }

      // Open Razorpay's secure checkout window.
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'LearnLive',
        description: course.title,
        order_id: order.orderId,

        handler: async function (response) {
          try {
            // Verify the payment on the backend.
            await request('/payments/verify', {
              method: 'POST',
              body: JSON.stringify(response),
            });

            flash(`Payment successful! You are enrolled in ${course.title}.`);

            await loadMyLearning();
            setPage('Dashboard');
          } catch (error) {
            console.error('Payment verification failed:', error);
            flash(
              `Payment verification failed: ${error.message}. Please contact support if money was deducted.`
            );
          }
        },

        prefill: {
          name: user.name || '',
          email: user.email || '',
        },

        theme: {
          color: '#4f46e5',
        },

        modal: {
          ondismiss: function () {
            flash('Checkout closed. You have not completed the purchase.');
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on('payment.failed', function (response) {
        const message =
          response.error?.description || 'Please try the payment again.';

        flash(`Payment failed: ${message}`);
      });

      checkout.open();
    } catch (error) {
      console.error('Course purchase failed:', error);
      flash(`Unable to start payment: ${error.message}`);
    } finally {
      setActionCourseId(null);
    }
  }

  async function loadInstructorCourses() {
    setLessonsCourseLoading(true);
    try {
      const result = await request('/courses');

      const courses = Array.isArray(result)
        ? result
        : result.courses || [];

      const myCourses =
        user?.role === 'admin'
          ? courses
          : courses.filter(
              (course) =>
                String(
                  course.instructor?._id || course.instructor
                ) === String(user?.id || user?._id)
            );

      setInstructorCourses(myCourses);
    } catch (error) {
      flash(`Unable to load courses: ${error.message}`);
    } finally {
      setLessonsCourseLoading(false);
    }
  }

  function startLessonEdit(lesson) {
    setEditingLessonId(String(lesson._id));
    setEditingLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
    });
    setEditingLessonVideo(null);
  }

  async function saveLessonEdit(lesson) {
    setLessonSaving(true);
    try {
      let videoJobId = lesson.videoJobId || '';
      if (editingLessonVideo) {
        const uploadResult = await uploadLessonVideo(editingLessonVideo);
        videoJobId = uploadResult.jobId;
      }

      const result = await request(
        `/courses/${selectedCourse._id}/lessons/${lesson._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editingLessonForm.title.trim(),
            description: editingLessonForm.description.trim(),
            videoJobId,
          }),
        }
      );

      setSelectedCourse((previous) => ({
        ...previous,
        lessons: previous.lessons.map((item) =>
          String(item._id) === String(lesson._id)
            ? result.lesson
            : item
        ),
      }));
      setEditingLessonId('');
      setEditingLessonVideo(null);
      flash('Lesson updated successfully.');
    } catch (error) {
      flash(`Unable to update lesson: ${error.message}`);
    } finally {
      setLessonSaving(false);
    }
  }

  async function removeLesson(lesson) {
    if (!window.confirm(`Remove "${lesson.title}" from this course?`)) return;

    setLessonSaving(true);
    try {
      const result = await request(
        `/courses/${selectedCourse._id}/lessons/${lesson._id}`,
        { method: 'DELETE' }
      );
      setSelectedCourse((previous) => ({
        ...previous,
        lessons: result.lessons || [],
      }));
      flash('Lesson removed successfully.');
    } catch (error) {
      flash(`Unable to remove lesson: ${error.message}`);
    } finally {
      setLessonSaving(false);
    }

  }

  async function removeLessonVideo(lesson) {
    setLessonSaving(true);
    try {
      const result = await request(
        `/courses/${selectedCourse._id}/lessons/${lesson._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: lesson.title,
            description: lesson.description || '',
            videoJobId: '',
          }),
        }
      );
      setSelectedCourse((previous) => ({
        ...previous,
        lessons: previous.lessons.map((item) =>
          String(item._id) === String(lesson._id) ? result.lesson : item
        ),
      }));
      flash('Lesson video removed successfully.');
    } catch (error) {
      flash(`Unable to remove lesson video: ${error.message}`);
    } finally {
      setLessonSaving(false);
    }
  }

  // FILTER COURSES
  async function loadMyLearning() {
    if (!user) {
      setPage('Welcome');
      flash('Please sign in to view your courses.');
      return;
    }
    setMyCoursesLoading(true);
    try {
      const data = await request('/learning/my-learning');
      setMyCourses(data.courses || []);
    } catch (error) {
      flash(`Unable to load your courses: ${error.message}`);
    } finally {
      setMyCoursesLoading(false);
    }
  }

  async function loadStudentQuizAttempts() {
    if (!user || user.role !== 'student') return;
    setStudentQuizLoading(true);
    try {
      const data = await request('/quizzes/my-attempts');
      setStudentQuizAttempts(data.attempts || []);
    } catch (error) {
      console.error('Unable to load quiz attempts:', error);
    } finally {
      setStudentQuizLoading(false);
    }
  }

  async function loadQuizzes(courseId) {
    setQuizzesLoading(true);
    setQuizzes([]);
    setSelectedQuiz(null);
    setQuizAnswers({});
    setQuizResult(null);

    try {
      const data = await request(`/quizzes/course/${courseId}`);
      setQuizzes(data.quizzes || []);
    } catch (error) {
      flash(`Unable to load quizzes: ${error.message}`);
    } finally {
      setQuizzesLoading(false);
    }
  }

  const downloadCertificate = async (course) => {
    try {
      const token = localStorage.getItem('learnlive_token');

      if (!token) {
        setNotice('Please sign in again to download your certificate.');
        return;
      }

      const courseId = course._id || course.id;

      const response = await fetch(`${API}/certificates/${courseId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to download certificate.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `learnlive-certificate-${courseId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
      setNotice('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Certificate download error:', error);
      setNotice(error.message || 'Unable to download certificate.');
    }
  };

  const filtered = courses.filter((course) => {
    const searchableText = [
      course.title,
      course.description,
      course.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });

  // NAVIGATION
  const nav = [
    { name: 'Explore', icon: Search },
    ...(user?.role === 'student'
      ? [
          { name: 'Certificates', icon: Award },
        ]
      : []),

    { name: 'Live Classes', icon: Video },
    { name: 'Dashboard', icon: LayoutDashboard },

    ...(user?.role === 'admin'
      ? [{ name: 'Admin Management', icon: ShieldCheck }]
      : []),
  ];

  const completedCourses = myCourses.filter((course) => course.progress === 100);
  const inProgressCourses = myCourses.filter((course) => course.progress < 100);
  const totalAttemptsCount = studentQuizAttempts.length;
  const passedQuizzesCount = studentQuizAttempts.filter((a) => a.passed).length;
  const averageQuizScore = totalAttemptsCount > 0
    ? Math.round(
        studentQuizAttempts.reduce(
          (acc, a) => acc + (Number(a.percentage) || 0),
          0
        ) / totalAttemptsCount
      )
    : null;

  const displayedStudentCourses =
    studentDashboardTab === 'in-progress'
      ? inProgressCourses
      : studentDashboardTab === 'completed'
      ? completedCourses
      : myCourses;

  // LOADING SCREEN
  if (showSplash) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #172b55 0%, #414b96 55%, #7168d8 100%)', color: '#fff', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center', animation: 'learnliveSplashIn 650ms ease both' }}>
          <div style={{ width: 76, height: 76, margin: '0 auto 18px', borderRadius: 22, display: 'grid', placeItems: 'center', background: '#fff', color: '#20345f', boxShadow: '0 15px 45px #111b443d' }}>
            <GraduationCap size={42} />
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px' }}>learn<span style={{ color: '#b8b6ff' }}>live</span></div>
          <p style={{ marginTop: 10, color: '#e1e5ff', letterSpacing: '2px', fontSize: 11 }}>LEARNING PLATFORM</p>
          <div style={{ width: 42, height: 4, borderRadius: 10, background: '#c5c5ff', margin: '28px auto 0', animation: 'learnliveSplashPulse 900ms ease-in-out infinite alternate' }} />
        </div>
        <style>{`@keyframes learnliveSplashIn { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes learnliveSplashPulse { from { opacity: .35; transform: scaleX(.65); } to { opacity: 1; transform: scaleX(1.15); } }`}</style>
      </div>
    );
  }

  if (authChecking) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <section className="generic-page">
            <h2>Loading LearnLive...</h2>
            <p>Checking your session and loading courses.</p>
          </section>
        </main>
      </div>
    );
  }

  async function loadManagedQuizzes() {
    setQuizzesLoading(true);

    try {
      const data = await request('/quizzes/instructor');
      setManagedQuizzes(data.quizzes || []);
    } catch (error) {
      flash(error.message || 'Failed to load quizzes', 'error');
    } finally {
      setQuizzesLoading(false);
    }
  }

  async function loadInstructorMetrics() {
    setMetricsLoading(true);
    setMetricsError('');

    try {
      const data = await request('/instructor/metrics');
      setInstructorMetrics(data);
      flash('Instructor metrics loaded successfully!');
    } catch (error) {
      setMetricsError(error.message || 'Unable to load instructor metrics.');
      flash(`Unable to load metrics: ${error.message}`, 'error');
    } finally {
      setMetricsLoading(false);
    }
  }

  async function startEditingQuiz(quizId) {
    try {
      const data = await request(`/quizzes/${quizId}`);
      const quiz = data.quiz;

      setEditingQuizId(quiz._id);
      setQuizTitle(quiz.title);
      setQuizCourseId(String(quiz.course?._id || quiz.course || ''));

      setNewQuizQuestions(
        quiz.questions.map((question) => ({
          prompt: question.prompt || '',
          options: [...(question.options || [])],
          correctOptionIndex: Number(question.correctOptionIndex ?? 0),
          points: Number(question.points || 1),
        }))
      );

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      flash(error.message || 'Unable to load quiz for editing', 'error');
    }
  }

  function cancelQuizEditing() {
    setEditingQuizId(null);
    setQuizTitle('');
    setQuizDescription('');
    setQuizCourseId('');

    setNewQuizQuestions([
      {
        prompt: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 1,
      },
    ]);
  }

  async function deleteManagedQuiz(quizId, quizTitle) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setQuizDeletingId(quizId);

    try {
      await request(`/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (editingQuizId === quizId) {
        cancelQuizEditing();
      }

      flash('Quiz deleted successfully!');
      await loadManagedQuizzes();
    } catch (error) {
      flash(error.message || 'Unable to delete quiz', 'error');
    } finally {
      setQuizDeletingId(null);
    }
  }

  const loadStudentPerformance = async () => {
    setStudentPerformanceLoading(true);
    setStudentPerformanceError('');

    try {
      const data = await request('/instructor/student-performance');

      setStudentPerformance(
        Array.isArray(data.students) ? data.students : []
      );
    } catch (error) {
      setStudentPerformanceError(
        error.message || 'Unable to load student performance.'
      );
    } finally {
      setStudentPerformanceLoading(false);
    }
  };

  // Load platform-wide admin statistics
  const loadAdminMetrics = async () => {
    try {
      setAdminLoading(true);
      setAdminError('');

      const data = await request('/admin/metrics');
      setAdminMetrics(data);
    } catch (error) {
      setAdminError(error.message || 'Unable to load admin metrics.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Load users
  const loadAdminUsers = async (search = adminUserSearch) => {
    try {
      setAdminLoading(true);
      setAdminError('');

      const params = new URLSearchParams({
        search,
        page: '1',
        limit: '50',
      });

      const data = await request(`/admin/users?${params.toString()}`);

      setAdminUsers(data.users || []);
    } catch (error) {
      setAdminError(error.message || 'Unable to load users.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Change a user's role
  const updateAdminUserRole = async (userId, role) => {
    try {
      setAdminLoading(true);
      setAdminError('');

      await request(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });

      await loadAdminUsers();
      await loadAdminMetrics();

      setNotice('User role updated successfully.');
    } catch (error) {
      setAdminError(error.message || 'Unable to update user role.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Load courses
  const loadAdminCourses = async (search = adminCourseSearch) => {
    try {
      setAdminLoading(true);
      setAdminError('');

      const params = new URLSearchParams({
        search,
        page: '1',
        limit: '50',
      });

      const data = await request(`/admin/courses?${params.toString()}`);

      setAdminCourses(data.courses || []);
    } catch (error) {
      setAdminError(error.message || 'Unable to load courses.');
    } finally {
      setAdminLoading(false);
    }
  };


  const openAdminCourseDetails = async (courseId) => {
    try {
      setAdminCourseDetailsLoading(true);
      setSelectedAdminCourse(null);
      setAdminError('');

      const details = await request(
        `/admin/courses/${courseId}/details`
      );

      console.log('Admin course details response:', details);
      setSelectedAdminCourse(details);
    } catch (error) {
      setAdminError(error.message || 'Unable to load course details.');
    } finally {
      setAdminCourseDetailsLoading(false);
    }
  };

  const closeAdminCourseDetails = () => {
    setSelectedAdminCourse(null);
  };

  // Publish or unpublish a course
  const toggleAdminCoursePublished = async (courseId, published) => {
    const action = published ? 'publish' : 'unpublish';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this course?`
    );

    if (!confirmed) return;

    try {
      setAdminLoading(true);
      setAdminError('');

      await request(`/admin/courses/${courseId}/published`, {
        method: 'PATCH',
        body: JSON.stringify({ published }),
      });

      await Promise.all([
        loadAdminCourses(),
        loadAdminMetrics(),
      ]);

      setNotice(
        published
          ? 'Course published successfully.'
          : 'Course unpublished successfully.'
      );
    } catch (error) {
      setAdminError(error.message || 'Unable to update course.');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!localStorage.getItem('learnlive_token')) return;

    setNotificationsLoading(true);

    try {
      const data = await request('/notifications');

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error.message);
      setNotice(`Unable to load notifications: ${error.message}`);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    const opening = !notificationsOpen;

    setNotificationsOpen(opening);

    if (opening) {
      await loadNotifications();
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await request(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      setNotice(`Unable to mark notification as read: ${error.message}`);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await request('/notifications/read-all', {
        method: 'PATCH',
      });

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      setNotice(`Unable to update notifications: ${error.message}`);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await request(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      setNotifications((previous) =>
        previous.filter((item) => item._id !== notificationId)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (error) {
      setNotice(`Unable to delete notification: ${error.message}`);
    }
  };

  // RENDER APPLICATION
  return (
    <div className="app-shell">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <GraduationCap size={23} />
          </span>

          <span>
            learn<span className="brand-accent">live</span>
            <small>LEARNING PLATFORM</small>
          </span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        {nav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => { if (!user && item.name !== 'Explore') { setLoginPortal(item.name === 'Dashboard' ? 'instructor' : 'student'); setPage('Welcome'); } else setPage(item.name); }}
              className={`nav-item ${
                page === item.name ? 'active' : ''
              }`}
            >
              <Icon size={18} />

              {item.name}

              {item.name === 'Live Classes' && (
                <span className="live-dot" />
              )}
            </button>
          );
        })}

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>

            <b>Keep growing</b>
            <p>Small lessons. Big progress.</p>

            <button onClick={() => setPage('Explore')}>
              Explore courses <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <b>{page}</b>
          </div>

          <div className="topbar-right">
            <span className="status-pill">
              <span />
              Platform online
            </span>

            {user && (
              <>
                <div className="header-user">
                  <div className="avatar small">
                    {user.name?.slice(0, 1).toUpperCase()}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm logout-btn"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>

                {user.role === 'admin' && (
                  <button
                    type="button"
                    className="admin-header-button"
                    onClick={() => {
                      setPage('Admin Management');
                      setShowNotifications(false);
                    }}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Management</span>
                  </button>
                )}
              </>
            )}
            {user && (
              <div className="notification-wrapper">
                <button
                  type="button"
                  className="notification-bell"
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={notificationsOpen}
                  onClick={toggleNotifications}
                >
                  <Bell size={22} />

                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <section
                    className="notification-panel"
                    aria-label="Notifications"
                  >
                    <div className="notification-header">
                      <div className="notification-title-group">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="notif-pill">{unreadCount} new</span>
                        )}
                      </div>

                      <div className="notification-header-actions">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="notif-header-btn"
                            onClick={markAllNotificationsRead}
                            title="Mark all as read"
                          >
                            <CheckCheck size={14} />
                            Mark all read
                          </button>
                        )}

                        <button
                          type="button"
                          className="notif-close-btn"
                          onClick={() => setNotificationsOpen(false)}
                          aria-label="Close notifications"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="notification-empty">
                        <p>Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-empty">
                        <Bell size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
                        <p>No notifications yet.</p>
                        <small>We'll notify you when live classes start or updates occur.</small>
                      </div>
                    ) : (
                      <div className="notification-list">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`notification-item ${
                              notification.isRead ? 'read' : 'unread'
                            }`}
                          >
                            <div className="notification-card-header">
                              <span className="notification-title">
                                {notification.title || 'Notification'}
                              </span>

                              {notification.createdAt && (
                                <span className="notification-time">
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            <p className="notification-body">
                              {notification.message ||
                                notification.content ||
                                'You have a new notification.'}
                            </p>

                            {notification.type === 'live-class' && notification.link && (
                              <div className="notification-live-card">
                                <span className="live-pulse-dot" />
                                <span className="live-code-text">
                                  Room: <code>{notification.link}</code>
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-primary notif-join-btn"
                                  onClick={() => {
                                    markNotificationRead(notification._id);
                                    joinLiveClass(notification.link);
                                  }}
                                >
                                  <Video size={13} />
                                  Join Now
                                </button>
                              </div>
                            )}

                            <div className="notification-actions">
                              {!notification.isRead && (
                                <button
                                  type="button"
                                  className="notif-action-btn read-btn"
                                  onClick={() =>
                                    markNotificationRead(notification._id)
                                  }
                                >
                                  <CheckCheck size={14} />
                                  Mark as read
                                </button>
                              )}

                              <button
                                type="button"
                                className="notif-action-btn delete-btn"
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

              </div>
            )}
          </div>
        </header>

        {notice && (
          <div className="toast" role="status">
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* PUBLIC WELCOME / PORTAL SELECTION */}
        {page === 'Welcome' && !user && (
          <section className="auth-layout">
            <div className="auth-art">
              <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
              <h1>Make learning<br />your superpower.</h1>
              <p>Learn from experts, build practical skills, and move forward one lesson at a time.</p>
              <div className="art-stat"><div>
                <b>Learn</b>
                <span>at your pace</span>
                </div>
                <div>
                  <b>Connect</b>
                  <span>live with experts</span></div></div>
            </div>
            <div className="auth-card" style={{ alignSelf: 'center' }}>
              <div className="eyebrow">WELCOME TO LEARNLIVE</div>
              <h2>Choose your portal</h2>
              <p className="muted">Select the account type you want to sign in with.</p>
              <button className="btn btn-primary full" type="button" onClick={() => { 
                setLoginPortal('student'); 
                setIsRegister(false); 
                setPage('Sign in'); 
              }} style={{ 
                justifyContent: 'space-between', marginTop: 22 
              }}>
                <span><strong>Student Login</strong>
                <br /><small style={{ 
                  color: 'inherit', opacity: .8 
                }}>Access courses and certificates</small></span>
                <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline full" type="button" onClick={() => { 
                setLoginPortal('instructor'); 
                setIsRegister(false); 
                setPage('Sign in'); 
                }} style={{ 
                  justifyContent: 'space-between', 
                  marginTop: 12 
                  }}>
                <span><strong>Instructor / Admin Login</strong><br />
                <small>Manage courses and learning</small></span>
                <ArrowRight size={18} />
              </button>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p className="switch-auth" style={{ margin: 0 }}>
                  New student?{' '}
                  <button type="button" onClick={() => { 
                    setLoginPortal('student'); 
                    setIsRegister(true); 
                    setPage('Sign in'); 
                  }}>Create student account</button>
                </p>
                <p className="switch-auth" style={{ margin: 0 }}>
                  New instructor?{' '}
                  <button type="button" onClick={() => { 
                    setLoginPortal('instructor'); 
                    setIsRegister(true); 
                    setPage('Sign in'); 
                  }}>Create instructor account</button>
                </p>
              </div>
              <button type="button" className="sign-in-link" style={{ 
                marginTop: 8 
              }} onClick={() => setPage('Explore')}>Browse public courses <ArrowRight size={14} /></button>
            </div>
          </section>
        )}
        
        {/* SIGN IN / REGISTER */}

        {page === 'Sign in' ? (
          <section className="auth-layout">
            <div className="auth-art">
              <span className="eyebrow">
                YOUR NEXT CHAPTER STARTS HERE
              </span>

              <h1>
                Make learning
                <br />
                your superpower.
              </h1>

              <p>
                Learn from experts, build practical skills, and move
                forward one lesson at a time.
              </p>

              <div className="art-stat">
                <div>
                  <b>Learn</b>
                  <span>at your pace</span>
                </div>

                <div>
                  <b>Connect</b>
                  <span>live with experts</span>
                </div>
              </div>
            </div>

            <form className="auth-card" onSubmit={submitAuth}>
              <div className="eyebrow">
                {isRegister
                  ? loginPortal === 'instructor'
                    ? 'INSTRUCTOR REGISTRATION'
                    : 'STUDENT REGISTRATION'
                  : loginPortal === 'instructor'
                  ? 'INSTRUCTOR / ADMIN PORTAL'
                  : 'STUDENT PORTAL'}
              </div>

              <h2>
                {isRegister
                  ? loginPortal === 'instructor'
                    ? 'Create instructor account'
                    : 'Create your account'
                  : 'Welcome back'}
              </h2>

              <p className="muted">
                {isRegister
                  ? loginPortal === 'instructor'
                    ? 'Register as an instructor to build courses and teach live classes.'
                    : 'Create your student account to get started.'
                  : loginPortal === 'student'
                  ? 'Sign in to continue your learning journey.'
                  : 'Sign in to manage courses and classes.'}
              </p>

              {isRegister && (
                <label>
                  Full name

                  <input
                    required
                    value={auth.name}
                    onChange={(event) =>
                      setAuth({
                        ...auth,
                        name: event.target.value,
                      })
                    }
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={auth.email}
                  onChange={(event) =>
                    setAuth({
                      ...auth,
                      email: event.target.value,
                    })
                  }
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password

                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete={
                    isRegister ? 'new-password' : 'current-password'
                  }
                  value={auth.password}
                  onChange={(event) =>
                    setAuth({
                      ...auth,
                      password: event.target.value,
                    })
                  }
                  placeholder="At least 8 characters"
                />
              </label>

              <button
                className="btn btn-primary full"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : isRegister
                  ? loginPortal === 'instructor'
                    ? 'Create instructor account'
                    : 'Create student account'
                  : 'Sign in'}

                <ArrowRight size={16} />
              </button>

              <p className="switch-auth" style={{ marginTop: 14 }}>
                <button type="button" onClick={() => { setNotice(''); setPage('Welcome'); }}>
                  ← Back to portal selection
                </button>
              </p>

              <p className="switch-auth">
                {isRegister
                  ? 'Already have an account?'
                  : loginPortal === 'instructor'
                  ? "Don't have an instructor account?"
                  : "Don't have a student account?"}

                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setNotice('');
                  }}
                >
                  {isRegister ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </form>
          </section>
        ) : null}

        {/* EXPLORE COURSES */}

        {page === 'Explore' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="sparkle">✦</span>
                  LEARN SOMETHING EXTRAORDINARY
                </span>

                <h1>
                  Skills that move
                  <br />
                  you <em>forward.</em>
                </h1>

                <p>
                  Expert-led courses, hands-on lessons, and live
                  learning experiences designed around your goals.
                </p>

                <div className="hero-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      document
                        .getElementById('catalogue')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    Explore courses <ArrowRight size={16} />
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={() => setPage('Live Classes')}
                  >
                    <PlayCircle size={17} />
                    Discover live classes
                  </button>
                </div>

                <div className="hero-trust">
                  <div className="mini-avatars">
                    <span>J</span>
                    <span>A</span>
                    <span>M</span>
                    <span>+</span>
                  </div>

                  <div>
                    <b>Learn at your own pace</b>
                    <small>Real skills. Real progress.</small>
                  </div>
                </div>
              </div>

              <div className="hero-visual">
                <div className="visual-glow" />

                <div className="floating-tag tag-top">
                  <span className="tag-icon purple">✦</span>

                  <div>
                    <b>Keep growing</b>
                    <small>One lesson at a time</small>
                  </div>
                </div>

                <div className="course-illustration">
                  <div className="illustration-top">
                    <span>LEARNLIVE / ACADEMY</span>
                    <span className="illustration-dot">●</span>
                  </div>

                  <div className="illustration-orbit">
                    <div className="orbit-ring" />

                    <div className="orbit-core">
                      <GraduationCap size={53} />
                    </div>

                    <span className="orbit-node node-one">JS</span>
                    <span className="orbit-node node-two">AI</span>
                    <span className="orbit-node node-three">UX</span>
                  </div>

                  <div className="illustration-caption">
                    <span>YOUR LEARNING JOURNEY</span>
                    <b>Build. Learn. Become.</b>
                  </div>
                </div>

                <div className="floating-tag tag-bottom">
                  <span className="tag-icon green">✓</span>

                  <div>
                    <b>Progress unlocked</b>
                    <small>You're on your way</small>
                  </div>
                </div>
              </div>
            </section>

            <section className="stats-row">
              <div>
                <span className="stat-icon blue">
                  <BookOpen size={19} />
                </span>

                <div>
                  <b>Expert-led learning</b>
                  <small>Courses built for real skills</small>
                </div>
              </div>

              <div>
                <span className="stat-icon purple">
                  <Video size={19} />
                </span>

                <div>
                  <b>Learn live</b>
                  <small>Connect with instructors</small>
                </div>
              </div>

              <div>
                <span className="stat-icon green">
                  <Award size={19} />
                </span>

                <div>
                  <b>Show your progress</b>
                  <small>Earn completion certificates</small>
                </div>
              </div>

              <div>
                <span className="stat-icon orange">
                  <Users size={19} />
                </span>

                <div>
                  <b>Learn together</b>
                  <small>Join a growing community</small>
                </div>
              </div>
            </section>

            <section className="catalogue" id="catalogue">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR NEXT BIG THING</span>

                  <h2>
                    Explore our courses<span className="period">.</span>
                  </h2>

                  <p>
                    Find the knowledge you need to get where you want
                    to go.
                  </p>
                </div>

                <div className="catalogue-tools">
                  <label className="search-box">
                    <Search size={17} />

                    <input
                      placeholder="Search courses..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>

                  {(user?.role === 'instructor' ||
                    user?.role === 'admin') && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setModal(true)}
                    >
                      <PlusCircle size={16} />
                      Create course
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-chip selected">
                  All courses <span>{filtered.length}</span>
                </span>

                <span className="filter-caption">
                  Curated for your next step
                </span>
              </div>

              <div className="course-grid">
                {filtered.map((course, index) => (
                  <article className="course-card" key={course._id}>
                    <div
                      className={`course-cover cover-${index % 4}`}
                    >
                      <div className="cover-top">
                        <span>{course.category || 'Learning'}</span>

                        <span className="cover-symbol">
                          {['◈', '⌘', '✳', '△'][index % 4]}
                        </span>
                      </div>

                      <div className="cover-art">
                        <div className="cover-ring" />

                        <span>
                          {['01', '02', '03', '04'][index % 4]}
                        </span>
                      </div>

                      <div className="cover-bottom">
                        <span>LEARNLIVE ACADEMY</span>
                        <span>✦</span>
                      </div>
                    </div>

                    <div className="course-card-body">
                      <div className="course-meta">
                        <span>{course.lessons?.length || 0} lessons</span>

                        <span className="meta-sep">·</span>

                        <span>Self-paced</span>

                        <span className="level-pill">All levels</span>
                      </div>

                      <h3>{course.title}</h3>

                      <p>{course.description}</p>

                      <div className="instructor-line">
                        <div className="instructor-avatar">
                          {(course.instructor?.name || 'L')
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>

                        <span>
                          {course.instructor?.name ||
                            'LearnLive Instructor'}
                        </span>

                        <b>
                          {Number(course.price || 0) === 0
                            ? 'Free'
                            : `₹${course.price}`}
                        </b>
                      </div>
                      
                      <button
                        className="course-action"
                        onClick={() => {
                          if (user?.role === 'instructor' || user?.role === 'admin') {
                            openCourse(course);
                          } else if (Number(course.price || 0) > 0) {
                            buyCourse(course);
                          } else {
                            enroll(course);
                          }
                        }}
                        disabled={Boolean(actionCourseId)}
                      >
                        {user?.role === 'instructor' || user?.role === 'admin' ? (
                          <>
                            View Course <ArrowRight size={15} />
                          </>
                        ) : actionCourseId === (course._id || course.id) ? (
                          'Please wait...'
                        ) : Number(course.price || 0) > 0 ? (
                          <>
                            Buy Course <ArrowRight size={15} />
                          </>
                        ) : (
                          <>
                            Enroll Free <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {!filtered.length && (
                <div className="empty-state">
                  No courses match "{query}". Try another search.
                </div>
              )}
            </section>
          </>
        )}

        {/* MY LEARNING */}
        
        {page === 'My Learning' && (
          <section className="generic-page my-learning-page">
            <div className="my-learning-heading">
              <div>
                <span className="eyebrow">YOUR JOURNEY</span>
                <h1>
                  My learning<span className="period">.</span>
                </h1>
                <p>Pick up where you left off and keep making progress.</p>
              </div>

              <button
                className="btn btn-primary"
                onClick={loadMyLearning}
                disabled={myCoursesLoading}
              >
                {myCoursesLoading ? 'Loading courses...' : 'Refresh courses'}
              </button>
            </div>

            {!myCoursesLoading && myCourses.length === 0 ? (
              <div className="my-learning-empty">
                <div className="my-learning-empty-icon">
                  <BookOpen size={32} />
                </div>
                <h2>Your learning journey starts here</h2>
                <p>
                  You haven't enrolled in any courses yet. Explore the catalogue
                  and find a course that matches your goals.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setPage('Explore')}
                >
                  Explore courses <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="my-learning-grid">
                {myCourses.map((course) => {
                  const lessons = course.lessons || [];
                  const completedLessons = course.completedLessons || [];
                  const totalLessons = course.totalLessons ?? lessons.length;
                  const validCompletedCount = lessons.filter((l) =>
                    completedLessons.map(String).includes(String(l._id))
                  ).length;
                  const completedCount = Math.min(
                    totalLessons,
                    course.completedCount ?? (validCompletedCount || completedLessons.length)
                  );
                  const progress = totalLessons
                    ? Math.min(
                        100,
                        Math.round((completedCount / totalLessons) * 100)
                      )
                    : 0;
                  const isCompleted = progress === 100;

                  return (
                    <article className="my-learning-card" key={course._id}>
                      <div className="my-learning-card-top">
                        <div className="my-learning-course-icon">
                          <BookOpen size={23} />
                        </div>
                        <span className="my-learning-status">
                          {progress === 100 ? 'Completed' : 'In progress'}
                        </span>
                      </div>

                      <div className="my-learning-card-content">
                        <h3>{course.title}</h3>
                        <p className="my-learning-description">
                          {course.description || 'Continue learning and building your skills.'}
                        </p>

                        <div className="my-learning-meta">
                          <span>
                            Instructor: {course.instructor?.name || 'Instructor not available'}
                          </span>
                          <span>
                            {completedCount} of {totalLessons} lessons
                          </span>
                        </div>

                        <div
                          className="my-learning-progress-track"
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${course.title} completion`}
                        >
                          <div
                            className="my-learning-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="my-learning-progress-label">
                          <span>Course progress</span>
                          <strong>{progress}%</strong>
                        </div>
                      </div>

                      <div className="my-learning-card-footer">
                        {isCompleted ? (
                          <div className="completed-card-actions">
                            <button
                              type="button"
                              className="btn btn-primary certificate-download-btn"
                              onClick={() => downloadCertificate(course)}
                              title="Download Official Certificate (PDF)"
                            >
                              <Award size={18} />
                              Download Certificate
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary review-course-btn"
                              onClick={() => {
                                setSelectedCourse(course);
                                setPage('Course Details');
                              }}
                            >
                              Review Course
                              <ArrowRight size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedCourse(course);
                              setPage('Course Details');
                            }}
                          >
                            Continue learning
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {page === 'Course Details' && selectedCourse && (
          <section className="generic-page">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedCourse(null);
                setSelectedQuiz(null);
                setQuizResult(null);
                setPage(
                  user?.role === 'student' ? 'Dashboard' : 'Explore'
                );
              }}
            >
              ← Back to {user?.role === 'student' ? 'Dashboard' : 'Explore'}
            </button>

            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.description}</p>

            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setPage('Manage Course Lessons')}
              >
                Manage course lessons
              </button>
            )}

            <p>
              Instructor: {selectedCourse.instructor?.name || 'Not available'}
            </p>

            <div className="quiz-section">
              <h2>Course Quizzes</h2>

              <button
                className="btn btn-secondary"
                onClick={() => loadQuizzes(selectedCourse._id)}
                disabled={quizzesLoading}
              >
                {quizzesLoading ? 'Loading quizzes...' : 'Load Quizzes'}
              </button>

              {quizzesLoading && <p>Loading available quizzes...</p>}

              {!quizzesLoading && quizzes.length === 0 && (
                <p>No quizzes found. Click "Load Quizzes" to check again.</p>
              )}

              {quizzes.map((quiz) => (
                <article key={quiz._id} className="feature-panel">
                  <div>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description || 'Test your knowledge of this course.'}</p>
                    <p>{quiz.questions?.length || 0} questions</p>

                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setQuizAnswers({});
                        setQuizResult(null);
                      }}
                    >
                      Take Quiz
                    </button>
                  </div>
                </article>
              ))}

              {selectedQuiz && !quizResult && (
                <div className="quiz-attempt">
                  <div className="quiz-attempt-header">
                    <div>
                      <span className="quiz-eyebrow">ASSESSMENT</span>
                      <h2>{selectedQuiz.title}</h2>
                      <p>Choose the best answer for each question.</p>
                    </div>

                    <div className="quiz-question-count">
                      <span>{Object.keys(quizAnswers).length}</span>
                      <span> / {selectedQuiz.questions?.length || 0} answered</span>
                    </div>
                  </div>

                  <div className="quiz-question-list">
                    {selectedQuiz.questions?.map((question, questionIndex) => (
                      <div
                        key={question._id || questionIndex}
                        className="quiz-question-card"
                      >
                        <div className="quiz-question-top">
                          <span className="quiz-number">
                            Question {String(questionIndex + 1).padStart(2, '0')}
                          </span>

                          <span className="quiz-points">
                            {question.points || 1}{' '}
                            {(question.points || 1) === 1 ? 'point' : 'points'}
                          </span>
                        </div>

                        <h3 className="quiz-question-title">
                          {question.prompt}
                        </h3>

                        <div className="quiz-options-list">
                          {question.options?.map((option, optionIndex) => {
                            const isSelected =
                              quizAnswers[questionIndex] === optionIndex;

                            return (
                              <label
                                key={optionIndex}
                                className={`quiz-option-card ${
                                  isSelected ? 'selected' : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${questionIndex}`}
                                  value={optionIndex}
                                  checked={isSelected}
                                  onChange={() =>
                                    setQuizAnswers((previous) => ({
                                      ...previous,
                                      [questionIndex]: optionIndex,
                                    }))
                                  }
                                />

                                <span className="quiz-option-letter">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>

                                <span className="quiz-option-text">
                                  {option}
                                </span>

                                <span className="quiz-option-indicator">
                                  {isSelected ? '✓' : ''}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="quiz-submit-panel">
                    <div>
                      <strong>
                        {Object.keys(quizAnswers).length ===
                        (selectedQuiz.questions?.length || 0)
                          ? 'All questions answered'
                          : `${(selectedQuiz.questions?.length || 0) -
                              Object.keys(quizAnswers).length} questions remaining`}
                      </strong>

                      <p>Review your answers before submitting.</p>
                    </div>

                    <button
                      className="btn btn-primary quiz-submit-button"
                      disabled={quizSubmitting}
                      onClick={async () => {
                        const questionCount = selectedQuiz.questions?.length || 0;

                        if (Object.keys(quizAnswers).length !== questionCount) {
                          flash('Please answer every question before submitting.');
                          return;
                        }

                        setQuizSubmitting(true);

                        try {
                          const result = await request(
                            `/quizzes/${selectedQuiz._id}/submit`,
                            {
                              method: 'POST',
                              body: JSON.stringify({
                                answers: Object.entries(quizAnswers).map(
                                  ([questionIndex, optionIndex]) => ({
                                    questionIndex: Number(questionIndex),
                                    optionIndex,
                                  })
                                ),
                              }),
                            }
                          );

                          setQuizResult(result);
                          flash('Quiz submitted successfully!');
                          loadStudentQuizAttempts();
                        } catch (error) {
                          flash(`Quiz submission failed: ${error.message}`);
                        } finally {
                          setQuizSubmitting(false);
                        }
                      }}
                    >
                      {quizSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  </div>
                </div>
              )}

              {selectedQuiz && quizResult && (
                 <div className="quiz-result">
                  <div className="quiz-result-card">
                    <div className="quiz-result-icon">
                      {quizResult.percentage >= 70 ? '✓' : '↻'}
                    </div>

                    <span className="quiz-result-eyebrow">
                      ASSESSMENT COMPLETED
                    </span>

                    <h2>
                      {quizResult.percentage === 100
                        ? 'Perfect Score!'
                        : quizResult.percentage >= 70
                        ? 'Well Done!'
                        : 'Keep Practising!'}
                    </h2>

                    <p className="quiz-result-description">
                      {quizResult.percentage === 100
                        ? 'Excellent work! You answered every question correctly.'
                        : quizResult.percentage >= 70
                        ? 'Great effort! Keep building your knowledge.'
                        : 'Review the course lessons and try again to improve your score.'}
                    </p>

                    <div className="quiz-result-score">
                      <div className="quiz-result-percentage">
                        <strong>{quizResult.percentage}%</strong>
                        <span>Overall score</span>
                      </div>

                      <div className="quiz-result-divider" />

                      <div className="quiz-result-marks">
                        <strong>
                          {quizResult.score}/{quizResult.total}
                        </strong>
                        <span>Marks earned</span>
                      </div>
                    </div>

                    <div className="quiz-result-progress">
                      <div
                        className="quiz-result-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, quizResult.percentage))}%`,
                        }}
                      />
                    </div>

                    <p className="quiz-result-footer">
                      Quiz: {selectedQuiz.title}
                    </p>

                    <div className="quiz-result-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedQuiz(null);
                          setQuizAnswers({});
                          setQuizResult(null);
                        }}
                      >
                        Back to Quizzes
                      </button>

                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedQuiz(null);
                          setQuizAnswers({});
                          setQuizResult(null);
                          setQuizzes([]);
                        }}
                      >
                        Close Results
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <h2>Lessons</h2>

            {selectedCourse.lessons?.length > 0 ? (
              <div>
                {selectedCourse.lessons.map((lesson, index) => (
                  <article key={lesson._id || index}>
                    <h3>
                      {index + 1}. {lesson.title || `Lesson ${index + 1}`}
                    </h3>

                    <p>{lesson.description || 'No description available.'}</p>

                    {console.log('Lesson video debug:', {
                      title: lesson.title,
                      lessonId: lesson._id,
                      videoJobId: lesson.videoJobId,
                      videoJobIdType: typeof lesson.videoJobId,
                    })}

                    {lesson.videoJobId ? (
                      <LessonVideo
                        key={String(lesson.videoJobId)}
                        videoJobId={String(lesson.videoJobId)}
                      />
                    ) : (
                      <p>No video uploaded for this lesson.</p>
                    )}    

                    <div className="lesson-actions">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            const result = await request(
                              `/learning/${selectedCourse._id}/lessons/${lesson._id}/progress`,
                              {
                                method: 'POST',
                                body: JSON.stringify({ completed: true }),
                              }
                            );

                            setSelectedCourse((previous) => ({
                              ...previous,
                              completedLessons: result.completedLessons,
                              progress: result.progress,
                            }));

                            flash('Lesson marked as completed!');
                          } catch (error) {
                            flash(`Unable to update lesson: ${error.message}`);
                          }
                        }}
                      >
                        {(selectedCourse.completedLessons || []).includes(String(lesson._id))
                          ? 'Completed ✓'
                          : 'Mark as completed'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No lessons have been added to this course yet.</p>
            )}
          </section>
        )}

        {/* MANAGE COURSE LESSONS PAGE */}
        {page === 'Manage Course Lessons' &&
          (user?.role === 'instructor' || user?.role === 'admin') && (
            <section className="generic-page">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage('Dashboard')}
              >
                ← Back to Dashboard
              </button>

              <h1>Manage Course Lessons</h1>
              <p>Add lessons and upload their videos to your courses.</p>

              {/* Lesson management form will go here */}
              <div className="feature-panel lesson-management-panel">
                <div className="lesson-course-selector">
                  <h2>Select a course</h2>

                  <label className="lesson-field">
                    <span>Choose the course whose lessons you want to manage</span>

                    <select
                      value={selectedCourse?._id || ''}
                      onChange={(event) => {
                        const course = courses.find(
                          (item) => item._id === event.target.value
                        );

                        setSelectedCourse(course || null);
                      }}
                    >
                      <option value="">Select a course</option>

                      {courses
                        .filter((course) => {
                          // Exclude demo courses
                          if (String(course._id).startsWith('demo')) {
                            return false;
                          }
                          // Admin can manage all courses
                          if (user?.role === 'admin') {
                            return true;
                          }
                          // Instructors can manage only their own courses
                          if (user?.role === 'instructor') {
                            const instructorId =
                              course.instructor?._id ||
                              course.instructor?.id ||
                              course.instructor;

                            return String(instructorId) === String(user._id || user.id);
                          }
                          return false;
                        })
                        .map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                {selectedCourse && (
                  <div className="lesson-management-form">
                    <h2>Manage Lessons: {selectedCourse.title}</h2>
                    <p>Add lessons, update lesson content, or replace and remove videos.</p>

                    {(selectedCourse.lessons || []).map((lesson, index) => (
                      <article className="lesson-editor" key={lesson._id}>
                        {editingLessonId === String(lesson._id) ? (
                          <>
                            <label className="lesson-field">
                              <span>Lesson title</span>
                              <input
                                value={editingLessonForm.title}
                                onChange={(event) =>
                                  setEditingLessonForm((previous) => ({
                                    ...previous,
                                    title: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="lesson-field">
                              <span>Lesson description</span>
                              <textarea
                                value={editingLessonForm.description}
                                onChange={(event) =>
                                  setEditingLessonForm((previous) => ({
                                    ...previous,
                                    description: event.target.value,
                                  }))
                                }
                                rows={3}
                              />
                            </label>
                            <label className="lesson-field">
                              <span>Replace video (optional)</span>
                              <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                onChange={(event) =>
                                  setEditingLessonVideo(
                                    event.target.files?.[0] || null
                                  )
                                }
                              />
                            </label>
                            <div className="lesson-editor-actions">
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => saveLessonEdit(lesson)}
                                disabled={lessonSaving || !editingLessonForm.title.trim()}
                              >
                                {lessonSaving ? 'Saving...' : 'Save changes'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setEditingLessonId('')}
                                disabled={lessonSaving}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="lesson-editor-summary">
                            <div>
                              <strong>
                                {index + 1}. {lesson.title}
                              </strong>
                              <p>{lesson.description || 'No description available.'}</p>
                              <small>
                                {lesson.videoJobId ? 'Video attached' : 'No video attached'}
                              </small>
                            </div>
                            <div className="lesson-editor-actions">
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => startLessonEdit(lesson)}
                                disabled={lessonSaving}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => removeLessonVideo(lesson)}
                                disabled={lessonSaving || !lesson.videoJobId}
                              >
                                Remove video
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeLesson(lesson)}
                                disabled={lessonSaving}
                              >
                                Remove lesson
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}

                    <form
                          onSubmit={async (event) => {
                            event.preventDefault();

                            if (!selectedCourse?._id) {
                              flash('Please select a course before adding a lesson.');
                              return;
                            }

                            if (!lessonForm.title.trim()) {
                              flash('Please enter a lesson title.');
                              return;
                            }

                            setNewLessonSaving(true);

                            try {
                              let videoJobId = '';

                              // Upload the video first, if one was selected.
                              if (lessonVideo) {
                                const uploadResult = await uploadLessonVideo(lessonVideo);
                                videoJobId = uploadResult.jobId;

                                flash('Video uploaded. Saving lesson while the video processes...');
                              }

                              const result = await request(
                                `/courses/${selectedCourse._id}/lessons`,
                                {
                                  method: 'POST',
                                  body: JSON.stringify({
                                    title: lessonForm.title.trim(),
                                    description: lessonForm.description.trim(),
                                    videoJobId,
                                  }),
                                }
                              );

                              const updatedLessons =
                                result.lessons || [
                                  ...(selectedCourse.lessons || []),
                                ];

                              setSelectedCourse((previous) => ({
                                ...previous,
                                lessons: updatedLessons,
                              }));

                              setLessonForm({ title: '', description: '' });
                              setLessonVideo(null);

                              const fileInput = document.getElementById('lesson-video-file');
                              if (fileInput) fileInput.value = '';

                              flash('Lesson created successfully.');
                            } catch (error) {
                              flash(`Unable to save lesson: ${error.message}`);
                            } finally {
                              setNewLessonSaving(false);
                            }
                          }}
                        >
                          <div className="lesson-form-grid">
                            <label className="lesson-field">
                              <span>Lesson title</span>
                              <input
                                type="text"
                                value={lessonForm.title}
                                onChange={(event) =>
                                  setLessonForm((previous) => ({
                                    ...previous,
                                    title: event.target.value,
                                  }))
                                }
                                placeholder="e.g. Introduction to Spring Boot"
                                required
                              />
                            </label>

                            <label className="lesson-field">
                              <span>Lesson description</span>
                              <textarea
                                value={lessonForm.description}
                                onChange={(event) =>
                                  setLessonForm((previous) => ({
                                    ...previous,
                                    description: event.target.value,
                                  }))
                                }
                                placeholder="What will students learn?"
                                rows={3}
                              />
                            </label>

                            <label className="lesson-field">
                              <span>Lesson video (MP4, MOV, or WebM)</span>
                              <input
                                id="lesson-video-file"
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                onChange={(event) =>
                                  setLessonVideo(event.target.files?.[0] || null)
                                }
                              />
                            </label>
                          </div>

                          {lessonVideo && (
                            <p className="lesson-selected-file">
                              Selected video: {lessonVideo.name}
                            </p>
                          )}

                          <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={newLessonSaving}
                          >
                            {newLessonSaving ? 'Saving lesson...' : 'Add Lesson'}
                          </button>
                        </form>
                  </div>
                )}
              </div>
            </section>
        )}

        {/* INSTRUCTOR QUIZ MANAGEMENT */}
        {page === 'Quiz Management' && (
          <section className="generic-page quiz-management-page">
            <button
              className="btn btn-secondary"
              onClick={() => setPage('Dashboard')}
            >
              ← Back to Dashboard
            </button>

            <div className="quiz-management-header">
              <span className="eyebrow">INSTRUCTOR WORKSPACE</span>

              <h1>
                Quiz Management<span className="period">.</span>
              </h1>

              <p>Create, organize, and manage assessments for your courses.</p>
            </div>

            <div className="quiz-management-form">
              <div className="quiz-form-header">
                <div>
                  <span className="eyebrow">ASSESSMENT BUILDER</span>
                  <h2>{editingQuizId ? 'Edit quiz' : 'Create a new quiz'}</h2>
                  <p>Set up your quiz and add questions for your students.</p>
                </div>

                <div className="quiz-form-icon" aria-hidden="true">
                  <ClipboardList size={28} />
                </div>
              </div>

              {/* QUIZ DETAILS */}
              <div className="quiz-form-grid">
                <label className="quiz-form-field">
                  Select course
                  <select
                    className="quiz-input"
                    value={quizCourseId}
                    onChange={(e) => setQuizCourseId(e.target.value)}
                  >
                    <option value="">Select a course</option>

                    {courses
                      .filter((course) => {
                        // Exclude demo fallback courses
                        if (String(course._id).startsWith('demo')) return false;

                        // Admin can manage quizzes for any course
                        if (user?.role === 'admin') return true;

                        // When editing an existing quiz, always retain its assigned course
                        if (editingQuizId && String(course._id) === String(quizCourseId)) {
                          return true;
                        }

                        // Instructors can only select courses they created
                        if (user?.role === 'instructor') {
                          const instructorId =
                            course.instructor?._id ||
                            course.instructor?.id ||
                            course.instructor;
                          const matchesId =
                            instructorId &&
                            String(instructorId) === String(user._id || user.id);
                          const matchesName =
                            course.instructor?.name &&
                            user?.name &&
                            course.instructor.name === user.name;

                          return Boolean(matchesId || matchesName);
                        }

                        return false;
                      })
                      .map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="quiz-form-field">
                  Quiz title
                  <input
                    className="quiz-input"
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Enter quiz title"
                  />
                </label>

                <label className="quiz-form-field quiz-description-field">
                  Description
                  <textarea
                    className="quiz-input quiz-textarea"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="Describe what students will be assessed on"
                    rows={4}
                  />
                </label>
              </div>


              {/* QUESTIONS HEADER */}
              <div className="quiz-builder-heading">
                <div>
                  <h3>Questions</h3>
                  <p>
                    Add multiple-choice questions and select the correct answer.
                  </p>
                </div>
              </div>

              {/* QUESTION EDITORS */}
              <div className="quiz-builder-list">
                {newQuizQuestions.map((question, questionIndex) => (
                  <article
                    className="quiz-builder-question"
                    key={questionIndex}
                  >
                    <div className="quiz-builder-question-heading">
                      <div className="quiz-question-number">
                        <span>
                          QUESTION {String(questionIndex + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="quiz-question-heading-actions">
                        <span className="quiz-points-badge">
                          {question.points} {Number(question.points) === 1 ? 'point' : 'points'}
                        </span>

                        {newQuizQuestions.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary quiz-remove-button"
                            onClick={() =>
                              setNewQuizQuestions((previous) =>
                                previous.filter(
                                  (_, index) => index !== questionIndex
                                )
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QUESTION TEXT */}
                    <label className="quiz-form-field">
                      Question text
                      <textarea
                        className="quiz-input quiz-textarea"
                        value={question.prompt}
                        onChange={(e) =>
                          setNewQuizQuestions((previous) =>
                            previous.map((item, index) =>
                              index === questionIndex
                                ? { ...item, prompt: e.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="Enter your question here..."
                        rows={2}
                      />
                    </label>

                    {/* ANSWER OPTIONS */}
                    <div className="quiz-options-heading">
                      <h5>Answer options</h5>
                      <span>Enter four possible answers</span>
                    </div>

                    <div className="quiz-builder-options">
                      {question.options.map((option, optionIndex) => (
                        <label
                          className="quiz-form-field quiz-option-field"
                          key={optionIndex}
                        >
                          <span>
                            Option {String.fromCharCode(65 + optionIndex)}
                          </span>

                          <div className="quiz-option-input-wrap">
                            <span className="quiz-option-letter">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>

                            <input
                              className="quiz-input"
                              value={option}
                              onChange={(e) =>
                                setNewQuizQuestions((previous) =>
                                  previous.map((item, index) =>
                                    index === questionIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((value, i) =>
                                            i === optionIndex
                                              ? e.target.value
                                              : value
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                              placeholder={`Enter option ${String.fromCharCode(
                                65 + optionIndex
                              )}`}
                            />
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* CORRECT ANSWER AND POINTS */}
                    <div className="quiz-question-settings">
                      <label className="quiz-form-field">
                        Correct answer
                        <select
                          className="quiz-input"
                          value={question.correctOptionIndex}
                          onChange={(e) =>
                            setNewQuizQuestions((previous) =>
                              previous.map((item, index) =>
                                index === questionIndex
                                  ? {
                                      ...item,
                                      correctOptionIndex: Number(e.target.value),
                                    }
                                  : item
                              )
                            )
                          }
                        >
                          {question.options.map((_, optionIndex) => (
                            <option key={optionIndex} value={optionIndex}>
                              Option {String.fromCharCode(65 + optionIndex)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="quiz-form-field">
                        Points
                        <input
                          className="quiz-input"
                          type="number"
                          min="1"
                          step="1"
                          value={question.points}
                          onChange={(e) =>
                            setNewQuizQuestions((previous) =>
                              previous.map((item, index) =>
                                index === questionIndex
                                  ? {
                                      ...item,
                                      points:
                                        e.target.value === ''
                                          ? ''
                                          : Number(e.target.value),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </label>
                    </div>
                  </article>
                ))}

                <button
                  type="button"
                  className="quiz-add-question-btn"
                  onClick={() =>
                    setNewQuizQuestions((previous) => [
                      ...previous,
                      {
                        prompt: '',
                        options: ['', '', '', ''],
                        correctOptionIndex: 0,
                        points: 1,
                      },
                    ])
                  }
                >
                  <PlusCircle size={18} />
                  Add question
                </button>
              </div>

              {/* FORM FOOTER */}
              <div className="quiz-builder-footer">
                <div className="quiz-builder-summary">
                  <span>
                    {newQuizQuestions.length}{' '}
                    {newQuizQuestions.length === 1 ? 'question' : 'questions'}
                  </span>

                  <span>
                    {newQuizQuestions.reduce(
                      (total, question) =>
                        total +
                        (Number(question.points) > 0 ? Number(question.points) : 0),
                      0
                    )}{' '}
                    total points
                  </span>
                </div>

                <div className="quiz-builder-footer-actions">
                  <button
                    type="button"
                    className="btn btn-primary quiz-save-button"
                    disabled={quizSaving}
                    onClick={async () => {
                      if (!quizCourseId || !quizTitle.trim()) {
                        flash('Please select a course and enter a quiz title.');
                        return;
                      }

                      if (newQuizQuestions.length === 0) {
                        flash('Please add at least one question.');
                        return;
                      }

                      const invalidQuestion = newQuizQuestions.some(
                        (question) =>
                          !question.prompt.trim() ||
                          question.options.length !== 4 ||
                          question.options.some(
                            (option) => typeof option !== 'string' || !option.trim()
                          ) ||
                          !Number.isInteger(Number(question.points)) ||
                          Number(question.points) < 1
                      );

                      if (invalidQuestion) {
                        flash(
                          'Complete every question and all four options. Points must be a positive whole number.'
                        );
                        return;
                      }

                      setQuizSaving(true);

                      try {
                        const isEditing = Boolean(editingQuizId);

                        const payload = {
                          title: quizTitle.trim(),
                          questions: newQuizQuestions.map((question) => ({
                            prompt: question.prompt.trim(),
                            options: question.options.map((option) => option.trim()),
                            correctOptionIndex: Number(question.correctOptionIndex),
                            points: Number(question.points),
                          })),
                        };

                        if (!isEditing) {
                          payload.courseId = quizCourseId;
                        }

                        await request(
                          isEditing ? `/quizzes/${editingQuizId}` : '/quizzes',
                          {
                            method: isEditing ? 'PATCH' : 'POST',
                            body: JSON.stringify(payload),
                          }
                        );

                        flash(
                          isEditing
                            ? 'Quiz updated successfully!'
                            : 'Quiz created successfully!'
                        );

                        setEditingQuizId(null);
                        setQuizTitle('');
                        setQuizDescription('');
                        setQuizCourseId('');

                        setNewQuizQuestions([
                          {
                            prompt: '',
                            options: ['', '', '', ''],
                            correctOptionIndex: 0,
                            points: 1,
                          },
                        ]);

                        await loadManagedQuizzes();
                      } catch (error) {
                        flash(`Unable to save quiz: ${error.message}`);
                      } finally {
                        setQuizSaving(false);
                      }
                    }}
                  >
                    {quizSaving ? (
                      'Saving quiz...'
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
                      </>
                    )}
                  </button>

                  {editingQuizId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cancelQuizEditing}
                      disabled={quizSaving}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

            </div>

            <section className="managed-quizzes-section">
              <div className="managed-quizzes-header">
                <div>
                  <span className="eyebrow">YOUR ASSESSMENTS</span>
                  <h2>Manage Quizzes</h2>
                  <p>View, edit, and delete quizzes you've created.</p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={loadManagedQuizzes}
                  disabled={quizzesLoading}
                >
                  {quizzesLoading ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>

              {quizzesLoading ? (
                <p>Loading quizzes...</p>
              ) : managedQuizzes.length === 0 ? (
                <div className="managed-quizzes-empty">
                  <ClipboardList size={32} />
                  <h3>No quizzes yet</h3>
                  <p>Create your first quiz using the assessment builder above.</p>
                </div>
              ) : (
                <div className="managed-quizzes-grid">
                  {managedQuizzes.map((quiz) => (
                    <article className="managed-quiz-card" key={quiz._id}>
                      <div className="managed-quiz-card-top">
                        <div className="managed-quiz-icon">
                          <ClipboardList size={22} />
                        </div>

                        <span className="managed-quiz-count">
                          {quiz.questionCount}{' '}
                          {quiz.questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      </div>

                      <h3>{quiz.title}</h3>
                      <p className="managed-quiz-course">
                        Course: {quiz.courseTitle}
                      </p>

                      <div className="managed-quiz-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => startEditingQuiz(quiz._id)}
                          disabled={quizDeletingId === quiz._id}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => deleteManagedQuiz(quiz._id, quiz.title)}
                          disabled={quizDeletingId === quiz._id}
                        >
                          {quizDeletingId === quiz._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}

        {/* LIVE CLASSES */}

        {page === 'Live Classes' && (
          <section className="generic-page">
            <span className="eyebrow">LEARN TOGETHER</span>

            <h1>
              Live Classes<span className="period">.</span>
            </h1>

            {!liveToken ? (
              <>
                <p>Join your instructor and classmates for live video and audio sessions.</p>

                {(user?.role === 'instructor' || user?.role === 'admin') && (
                  <div className="feature-panel instructor-live-panel" style={{ marginBottom: 24, border: '1px solid #c9cef9', background: '#fafbff' }}>
                    <div className="feature-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                      <Video size={25} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="eyebrow" style={{ fontSize: 11, color: '#4f46e5', fontWeight: 800, letterSpacing: 1.5, display: 'block', marginBottom: 4 }}>
                        INSTRUCTOR STUDIO
                      </span>
                      <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#1e293b' }}>
                        Host a Live Class & Notify Students
                      </h3>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                        Start a live session for your course. All enrolled students will automatically receive a notification with the room code to join.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          Select course
                          <select
                            className="quiz-input"
                            style={{ height: 46, borderRadius: 8, padding: '0 12px', border: '1px solid #cbd5e1', background: '#fff' }}
                            value={hostCourseId}
                            onChange={(e) => {
                              const courseId = e.target.value;
                              setHostCourseId(courseId);
                              const selected = courses.find((c) => String(c._id) === String(courseId));
                              if (selected) {
                                const cleanSlug = selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 16).replace(/^-|-$/g, '');
                                setHostRoomName(`${cleanSlug}-${Math.floor(1000 + Math.random() * 9000)}`);
                              }
                            }}
                          >
                            <option value="">Select a course to host</option>
                            {courses
                              .filter((course) => {
                                if (String(course._id).startsWith('demo')) return false;
                                if (user?.role === 'admin') return true;
                                if (user?.role === 'instructor') {
                                  const instructorId =
                                    course.instructor?._id ||
                                    course.instructor?.id ||
                                    course.instructor;
                                  const matchesId =
                                    instructorId &&
                                    String(instructorId) === String(user._id || user.id);
                                  const matchesName =
                                    course.instructor?.name &&
                                    user?.name &&
                                    course.instructor.name === user.name;
                                  return Boolean(matchesId || matchesName);
                                }
                                return false;
                              })
                              .map((course) => (
                                <option key={course._id} value={course._id}>
                                  {course.title}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          Meeting code (Room ID)
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 8, padding: '0 12px', border: '1px solid #cbd5e1', maxWidth: '100%', background: '#fff' }}
                              placeholder="e.g. data-science-101"
                              value={hostRoomName}
                              onChange={(e) => setHostRoomName(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0 14px', whiteSpace: 'nowrap', height: 46, borderRadius: 8 }}
                              onClick={() => {
                                const randomCode = `room-${Math.floor(100000 + Math.random() * 900000)}`;
                                setHostRoomName(randomCode);
                              }}
                            >
                              New Code
                            </button>
                          </div>
                        </label>
                      </div>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 16 }}>
                        Topic / Session note (Optional)
                        <input
                          type="text"
                          style={{ width: '100%', maxWidth: '100%', height: 46, borderRadius: 8, padding: '0 12px', border: '1px solid #cbd5e1', background: '#fff' }}
                          placeholder="e.g. Doubt clearing and Q&A session"
                          value={hostTopic}
                          onChange={(e) => setHostTopic(e.target.value)}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '0 24px', borderRadius: 8 }}
                        onClick={broadcastAndStartLiveClass}
                        disabled={hostBroadcasting || !hostCourseId || !hostRoomName.trim()}
                      >
                        <Video size={18} />
                        {hostBroadcasting ? 'Broadcasting & Connecting...' : 'Start Class & Notify Students'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="feature-panel">
                  <div className="feature-icon">
                    <Video size={25} />
                  </div>

                  <div>
                    <h3>Join a Live Class</h3>
                    <p>Enter the meeting code provided by your instructor.</p>

                    <input
                      type="text"
                      placeholder="Enter meeting code"
                      value={liveRoomName}
                      onChange={(e) => setLiveRoomName(e.target.value)}
                      disabled={liveConnecting}
                    />

                    <button
                      className="btn btn-primary"
                      onClick={() => joinLiveClass()}
                      disabled={liveConnecting}
                    >
                      {liveConnecting ? 'Connecting...' : 'Join Class'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="live-classroom">
                <h2>Room: {liveRoomName}</h2>

                <LiveKitRoom
                  token={liveToken}
                  serverUrl={liveServerUrl}
                  connect={true}
                  audio={true}
                  video={true}
                  onDisconnected={() => {
                    setLiveToken('');
                    setLiveServerUrl('');
                  }}
                  style={{ height: '75vh' }}
                >
                  <VideoConference chatMessageFormatter={undefined} />
                  <RoomAudioRenderer />
                </LiveKitRoom>

                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setLiveToken('');
                    setLiveServerUrl('');
                  }}
                >
                  Leave Class
                </button>
              </div>
            )}
          </section>
        )}
        
        {/* CERTIFICATES */}
        {page === 'Certificates' && (
          <section className="generic-page">
            <span className="eyebrow">YOUR ACHIEVEMENTS</span>
            <h1>
              Certificates<span className="period">.</span>
            </h1>
            <p>Download certificates for courses you have successfully completed.</p>

            {!user ? (
              <p>Please sign in to view your certificates.</p>
            ) : myCourses.filter((course) => course.progress === 100).length === 0 ? (
              <div className="feature-panel">
                <div className="feature-icon">
                  <Award size={25} />
                </div>
                <div>
                  <h3>No certificates yet</h3>
                  <p>Complete all lessons in a course to earn your certificate.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setPage('Dashboard')}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="certificate-grid">
                {myCourses
                  .filter((course) => course.progress === 100)
                  .map((course) => (
                    <article className="certificate-card" key={course._id}>
                      <div className="certificate-card-top">
                        <div className="certificate-card-icon">
                          <Award size={26} />
                        </div>
                        <span className="certificate-badge">Completed</span>
                      </div>

                      <div className="certificate-card-body">
                        <h3>{course.title}</h3>

                        <div className="certificate-meta">
                          <div>
                            <small>Instructor</small>
                            <span>{course.instructor?.name || 'Not available'}</span>
                          </div>
                          <div>
                            <small>Lessons completed</small>
                            <span>{course.totalLessons}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary certificate-download-btn"
                        onClick={() => downloadCertificate(course)}
                      >
                        <Award size={18} />
                        Download Certificate
                      </button>
                    </article>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ADMIN MANAGEMENT */}

        {page === 'Admin Management' && user?.role === 'admin' && (
          <section className="generic-page instructor-dashboard">
            <span className="eyebrow">PLATFORM CONTROL CENTER</span>

            <h1>
              Admin Management<span className="period">.</span>
            </h1>

            <p>Manage users, courses, and platform activity.</p>

            {adminError && (
              <div className="dashboard-error" role="alert">
                {adminError}
              </div>
            )}

            {/* PLATFORM STATISTICS */}
            <div className="instructor-dashboard-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={loadAdminMetrics}
                disabled={adminLoading}
              >
                {adminLoading ? 'Loading...' : 'Refresh Platform Statistics'}
              </button>
            </div>

            {adminMetrics && (
              <div className="instructor-metrics-section">
                <h2>Platform Overview</h2>

                <div className="instructor-metrics-grid">
                  {[
                    ['Total Users', adminMetrics.totalUsers],
                    ['Students', adminMetrics.totalStudents],
                    ['Instructors', adminMetrics.totalInstructors],
                    ['Administrators', adminMetrics.totalAdmins],
                    ['Total Courses', adminMetrics.totalCourses],
                    ['Published Courses', adminMetrics.publishedCourses],
                    ['Unpublished Courses', adminMetrics.unpublishedCourses],
                    ['Enrollments', adminMetrics.totalEnrollments],
                    ['Total Quizzes', adminMetrics.totalQuizzes],
                    ['Quiz Attempts', adminMetrics.totalAttempts],
                  ].map(([label, value]) => (
                    <article className="instructor-metric-card" key={label}>
                      <span className="instructor-metric-label">{label}</span>
                      <strong>{value ?? 0}</strong>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* USER MANAGEMENT */}
            <div className="student-performance-section">
              <div className="student-performance-heading">
                <div>
                  <span className="eyebrow">ACCOUNT CONTROL</span>
                  <h2>User Management</h2>
                  <p>Search users and manage their account roles.</p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => loadAdminUsers()}
                  disabled={adminLoading}
                >
                  Load Users
                </button>
              </div>

              <div className="student-performance-toolbar">
                <input
                  type="search"
                  className="student-performance-search"
                  placeholder="Search by name or email..."
                  value={adminUserSearch}
                  onChange={(event) => setAdminUserSearch(event.target.value)}
                  aria-label="Search users"
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => loadAdminUsers(adminUserSearch)}
                  disabled={adminLoading}
                >
                  Search
                </button>
              </div>

              <div className="admin-user-filters" role="group" aria-label="Filter users">
                {[
                  { label: 'All Users', value: 'all' },
                  { label: 'Students', value: 'student' },
                  { label: 'Instructors', value: 'instructor' },
                  { label: 'Admins', value: 'admin' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`admin-user-filter ${
                      adminUserRoleFilter === filter.value ? 'active' : ''
                    }`}
                    onClick={() => setAdminUserRoleFilter(filter.value)}
                    aria-pressed={adminUserRoleFilter === filter.value}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {adminUsers.length === 0 ? (
                <p className="student-performance-message">
                  Select Load Users to view registered accounts.
                </p>
              ) : (
                <div className="student-performance-list">
                  {adminUsers
                    .filter((adminUser) => {
                      return (
                        adminUserRoleFilter === 'all' ||
                        adminUser.role === adminUserRoleFilter
                      );
                    })
                  .map((adminUser) => (
                    <article
                      className="student-performance-card"
                      key={adminUser._id}
                    >
                      <div className="student-performance-card-top">
                        <div className="student-performance-avatar">
                          {String(adminUser.name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="student-performance-identity">
                          <h3>{adminUser.name}</h3>
                          <p>{adminUser.email}</p>
                        </div>

                        <span className={`admin-role-badge admin-role-${adminUser.role}`}
                        >
                          {adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1)}
                        </span>
                      </div>

                      <div className="admin-role-control">
                        <span>Account role</span>
                        <strong className="admin-role-value">
                          {adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1)}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* COURSE MANAGEMENT */}
            <div className="student-performance-section">
              <div className="student-performance-heading">
                <div>
                  <span className="eyebrow">CONTENT CONTROL</span>
                  <h2>Course Management</h2>
                  <p>Review courses and control their publication status.</p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => loadAdminCourses()}
                  disabled={adminLoading}
                >
                  Load Courses
                </button>
              </div>

              <div className="student-performance-toolbar">
                <input
                  type="search"
                  className="student-performance-search"
                  placeholder="Search courses by title..."
                  value={adminCourseSearch}
                  onChange={(event) => setAdminCourseSearch(event.target.value)}
                  aria-label="Search courses"
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => loadAdminCourses(adminCourseSearch)}
                  disabled={adminLoading}
                >
                  Search
                </button>
              </div>
              <div className="admin-course-filters" role="group" aria-label="Filter courses">
                {[
                  { label: 'All Courses', value: 'all' },
                  { label: 'Published', value: 'published' },
                  { label: 'Unpublished', value: 'unpublished' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`admin-course-filter ${
                      adminCourseFilter === filter.value ? 'active' : ''
                    }`}
                    onClick={() => setAdminCourseFilter(filter.value)}
                    aria-pressed={adminCourseFilter === filter.value}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {adminCourses.length === 0 ? (
                <p className="student-performance-message">
                  Select Load Courses to view available courses.
                </p>
              ) : (
                <div className="student-performance-list">
                  {adminCourses
                  .filter((course) => {
                    if (adminCourseFilter === 'published') {
                      return course.published;
                    }

                    if (adminCourseFilter === 'unpublished') {
                      return !course.published;
                    }

                    return true;
                  })
                  .map((course) => (
                    <article
                      className="student-performance-card"
                      key={course._id}
                    >
                      <div className="student-performance-card-top">
                        <div className="student-performance-identity">
                          <h3>{course.title}</h3>
                          <p>{course.category || 'Uncategorized'}</p>
                          <p>
                            Instructor:{' '}
                            {course.instructor?.name || 'Unknown'}
                          </p>
                        </div>

                        <span
                          className={`admin-course-status ${
                            course.published ? 'is-published' : 'is-unpublished'
                          }`}
                        >
                          <span className="admin-course-status-dot" />
                          {course.published ? 'Published' : 'Unpublished'}
                        </span>
                      </div>

                      <p>
                        Price: ₹
                        {Number(course.price || 0).toLocaleString('en-IN')}
                      </p>

                      <div className="admin-course-card-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openAdminCourseDetails(course._id)}
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          className="admin-course-action"
                          disabled={adminLoading}
                          onClick={() =>
                            toggleAdminCoursePublished(
                              course._id,
                              !course.published
                            )
                          }
                        >
                          {adminLoading
                            ? 'Updating...'
                            : course.published
                              ? 'Unpublish Course'
                              : 'Publish Course'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {(selectedAdminCourse || adminCourseDetailsLoading) && (
          <div
            className="admin-drawer-overlay"
            onClick={closeAdminCourseDetails}
          >
            <aside
              className="admin-course-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-course-drawer-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="admin-drawer-header">
                <div>
                  <span className="section-eyebrow">COURSE INFORMATION</span>
                  <h2 id="admin-course-drawer-title">Course Details</h2>
                </div>

                <button
                  type="button"
                  className="admin-drawer-close"
                  onClick={closeAdminCourseDetails}
                  aria-label="Close course details"
                >
                  ×
                </button>
              </div>

              {adminCourseDetailsLoading ? (
                <p className="admin-drawer-message">
                  Loading course details...
                </p>
              ) : (
                selectedAdminCourse && (
                  <>
                    <div className="admin-drawer-course-intro">
                      <h3>{selectedAdminCourse.title}</h3>

                      <span
                        className={`admin-course-status ${
                          selectedAdminCourse.published
                            ? 'is-published'
                            : 'is-unpublished'
                        }`}
                      >
                        <span className="admin-course-status-dot" />
                        {selectedAdminCourse.published
                          ? 'Published'
                          : 'Unpublished'}
                      </span>

                      <p>
                        {selectedAdminCourse.description ||
                          'No course description available.'}
                      </p>
                    </div>

                    <section className="admin-drawer-section">
                      <h4>Course Information</h4>

                      <div className="admin-course-detail-grid">
                        <div className="admin-course-detail-item">
                          <span>Category</span>
                          <strong>
                            {selectedAdminCourse.category || 'General'}
                          </strong>
                        </div>

                        <div className="admin-course-detail-item">
                          <span>Price</span>
                          <strong>
                            ₹{Number(
                              selectedAdminCourse.price || 0
                            ).toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div className="admin-course-detail-item">
                          <span>Total Lessons</span>
                          <strong>
                            {Array.isArray(selectedAdminCourse.lessons)
                              ? selectedAdminCourse.lessons.length
                              : Array.isArray(selectedAdminCourse.content)
                                ? selectedAdminCourse.content.length
                                : 0}
                          </strong>
                        </div>

                        <div className="admin-course-detail-item">
                          <span>Enrollments</span>
                          <strong>
                            {selectedAdminCourse.enrollmentCount}
                          </strong>
                        </div>
                      </div>
                    </section>

                    <section className="admin-drawer-section">
                      <h4>Instructor</h4>

                      {selectedAdminCourse.instructor ? (
                        <div className="admin-course-instructor">
                          <div className="admin-course-avatar">
                            {(
                              selectedAdminCourse.instructor.name || 'I'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {selectedAdminCourse.instructor.name}
                            </strong>
                            <p>
                              {selectedAdminCourse.instructor.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="admin-drawer-message">
                          Instructor information is unavailable.
                        </p>
                      )}
                    </section>

                    <section className="admin-drawer-section">
                      <h4>Course Activity</h4>

                      <div className="admin-course-detail-item">
                        <span>Created</span>
                        <strong>
                          {selectedAdminCourse.createdAt
                            ? new Date(
                                selectedAdminCourse.createdAt
                              ).toLocaleDateString('en-IN')
                            : 'Not available'}
                        </strong>
                      </div>
                    </section>
                  </>
                )
              )}
            </aside>
          </div>
        )}

        {/* ADMIN COURSE DETAILS DRAWER */}
        {page === 'Admin Management' &&
          user?.role === 'admin' &&
          selectedAdminCourse && (
            <div
              className="admin-drawer-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedAdminCourse(null);
                }
              }}
            >
              <aside
                className="admin-course-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-course-drawer-title"
              >
                {/* Drawer header */}
                <div className="admin-drawer-header">
                  <div>
                    <span className="eyebrow">COURSE INFORMATION</span>

                    <h2 id="admin-course-drawer-title">
                      Course Details
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="admin-drawer-close"
                    onClick={() => setSelectedAdminCourse(null)}
                    aria-label="Close course details"
                  >
                    ×
                  </button>
                </div>

                {/* Course title and status */}
                <div className="admin-drawer-course-intro">
                  <h3>{selectedAdminCourse.title || 'Untitled Course'}</h3>

                  <span
                    className={`admin-course-status ${
                      selectedAdminCourse.published
                        ? 'is-published'
                        : 'is-unpublished'
                    }`}
                  >
                    <span className="admin-course-status-dot" />

                    {selectedAdminCourse.published
                      ? 'Published'
                      : 'Unpublished'}
                  </span>

                  <p>
                    {selectedAdminCourse.description ||
                      'No course description available.'}
                  </p>
                </div>

                {/* Course information */}
                <div className="admin-drawer-section">
                  <h4>Course Information</h4>

                  <div className="admin-drawer-info-grid">
                    <div className="admin-drawer-info-item">
                      <span>Category</span>

                      <strong>
                        {selectedAdminCourse.category || 'Not specified'}
                      </strong>
                    </div>

                    <div className="admin-drawer-info-item">
                      <span>Price</span>

                      <strong>
                        ₹
                        {Number(
                          selectedAdminCourse.price || 0
                        ).toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="admin-drawer-info-item">
                      <span>Total Lessons</span>

                      <strong>
                        {selectedAdminCourse.totalLessons ?? 0}
                      </strong>
                    </div>

                    <div className="admin-drawer-info-item">
                      <span>Enrollments</span>

                      <strong>
                        {selectedAdminCourse.enrollmentCount ??
                          selectedAdminCourse.totalEnrollments ??
                          selectedAdminCourse.enrollmentsCount ??
                          'Not available'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Instructor information */}
                <div className="admin-drawer-section">
                  <h4>Instructor</h4>

                  <div className="admin-drawer-instructor">
                    <div className="admin-drawer-instructor-avatar">
                      {String(
                        selectedAdminCourse.instructor?.name || 'I'
                      )
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {selectedAdminCourse.instructor?.name ||
                          'Instructor not available'}
                      </strong>

                      <p>
                        {selectedAdminCourse.instructor?.email ||
                          'Email not available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Drawer actions */}
                <div className="admin-drawer-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedAdminCourse(null)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="admin-course-action"
                    disabled={adminLoading}
                    onClick={async () => {
                      const course = selectedAdminCourse;

                      await toggleAdminCoursePublished(
                        course._id,
                        !course.published
                      );

                      setSelectedAdminCourse((current) => {
                        if (
                          !current ||
                          String(current._id) !== String(course._id)
                        ) {
                          return current;
                        }

                        return {
                          ...current,
                          published: !course.published,
                        };
                      });
                    }}
                  >
                    {selectedAdminCourse.published
                      ? 'Unpublish Course'
                      : 'Publish Course'}
                  </button>
                </div>
              </aside>
            </div>
          )}

        {/* DASHBOARD */}

        {page === 'Dashboard' && (
          <section
            className={`generic-page ${
              user?.role === 'student'
                ? 'student-dashboard'
                : 'instructor-dashboard'
            }`}
          >
            <span className="eyebrow">YOUR WORKSPACE</span>

            <h1>
              Dashboard<span className="period">.</span>
            </h1>

            <p>
              {user
                ? `Signed in as ${user.name} (${user.role}).`
                : 'Sign in to access your learning dashboard.'}
            </p>

            {user?.role === 'instructor' || user?.role === 'admin' ? (
              <>
                <div className="instructor-dashboard-actions">
                  {/* Create a course using the existing modal */}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setModal(true)}
                    >
                      <PlusCircle size={16} />
                      Create Course
                    </button>

                    {/* Navigate to the existing course catalogue */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPage('Explore')}
                    >
                      <BookOpen size={16} />
                      Explore Courses
                      <ArrowRight size={16} />
                    </button>

                    {/* Existing instructor metrics */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={loadInstructorMetrics}
                      disabled={metricsLoading}
                    >
                      {metricsLoading ? 'Loading metrics...' : 'Load Instructor Metrics'}
                    </button>

                    {/* Existing quiz management */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPage('Quiz Management')}
                    >
                      Manage Quizzes
                      <ArrowRight size={16} />
                    </button>

                    {/* Manage course lessons */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPage('Manage Course Lessons')}
                    >
                      <BookOpen size={16} />
                      Manage Course Lessons
                      <ArrowRight size={16} />
                    </button>

                    {/* Host Live Class */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPage('Live Classes')}
                    >
                      <Video size={16} />
                      Host Live Class
                      <ArrowRight size={16} />
                    </button>
                </div>

                {metricsError && (
                  <div className="dashboard-error" role="alert">
                    {metricsError}
                  </div>
                )}

                {instructorMetrics && (
                  <div className="instructor-metrics-section">
                    <div className="instructor-metrics-heading">
                      <div>
                        <span className="eyebrow">PERFORMANCE OVERVIEW</span>
                        <h2>Instructor Statistics</h2>
                        <p>Track your courses and student assessment activity.</p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={loadInstructorMetrics}
                        disabled={metricsLoading}
                      >
                        {metricsLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    <div className="instructor-metrics-grid">
                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Total Courses</span>
                        <strong>{instructorMetrics.courseCount ?? 0}</strong>
                        <span>Courses you manage</span>
                      </article>

                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Enrollments</span>
                        <strong>{instructorMetrics.enrollmentCount ?? 0}</strong>
                        <span>Total course enrollments</span>
                      </article>

                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Total Quizzes</span>
                        <strong>{instructorMetrics.quizCount ?? 0}</strong>
                        <span>Assessments created</span>
                      </article>

                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Quiz Attempts</span>
                        <strong>{instructorMetrics.attemptCount ?? 0}</strong>
                        <span>Student submissions</span>
                      </article>

                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Total Questions</span>
                        <strong>{instructorMetrics.totalQuestions ?? 0}</strong>
                        <span>Questions across your quizzes</span>
                      </article>

                      <article className="instructor-metric-card">
                        <span className="instructor-metric-label">Average Quiz Score</span>
                        <strong>
                          {instructorMetrics.averageQuizScore ?? 0}%
                        </strong>
                        <span>Average across submitted attempts</span>
                      </article>
                    </div>

                    <div className="instructor-metrics-note">
                      <strong>Course value:</strong>{' '}
                      ₹{Number(instructorMetrics.listedCourseValue ?? 0).toLocaleString('en-IN')}
                      <p>
                        This represents the combined listed prices of your courses,
                        not verified revenue or actual earnings.
                      </p>
                    </div>
                  </div>
                )}
                
              <div className="student-performance-section">
                <div className="student-performance-heading">
                  <div>
                    <span className="eyebrow">LEARNER INSIGHTS</span>
                    <h2>Student Performance</h2>
                    <p>Review enrollments and quiz results for your students.</p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadStudentPerformance}
                    disabled={studentPerformanceLoading}
                  >
                    {studentPerformanceLoading ? 'Loading...' : 'Load Students'}
                  </button>
                </div>

                {studentPerformanceError && (
                  <div className="student-performance-error">
                    {studentPerformanceError}
                  </div>
                )}

                {studentPerformanceLoading ? (
                  <p className="student-performance-message">
                    Loading student performance...
                  </p>
                ) : (
                  <>
                    <div className="student-performance-summary">
                      <article className="student-performance-summary-card">
                        <span>Total Students</span>
                        <strong>
                          {new Set(studentPerformance.map((student) => student.studentId)).size}
                        </strong>
                      </article>

                      <article className="student-performance-summary-card">
                        <span>Course Enrollments</span>
                        <strong>{studentPerformance.length}</strong>
                      </article>
                    </div>

                    <div className="student-performance-toolbar">
                      <input
                        type="search"
                        className="student-performance-search"
                        placeholder="Search by student or course..."
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        aria-label="Search students by name or course"
                      />
                    </div>

                    {studentPerformance.filter((student) => {
                      const search = studentSearch.trim().toLowerCase();

                      return (
                        String(student.studentName || '').toLowerCase().includes(search) ||
                        String(student.studentEmail || '').toLowerCase().includes(search) ||
                        String(student.courseTitle || '').toLowerCase().includes(search)
                      );
                    }).length === 0 ? (
                      <p className="student-performance-message">
                        {studentPerformance.length === 0
                          ? 'No student performance records loaded. Select Load Students to fetch the latest data.'
                          : 'No students match your search.'}
                      </p>
                    ) : (
                      <div className="student-performance-list">
                        {studentPerformance
                          .filter((student) => {
                            const search = studentSearch.trim().toLowerCase();

                            return (
                              String(student.studentName || '').toLowerCase().includes(search) ||
                              String(student.studentEmail || '').toLowerCase().includes(search) ||
                              String(student.courseTitle || '').toLowerCase().includes(search)
                            );
                          })
                          .map((student, index) => (
                            <article
                              className="student-performance-card"
                              key={`${student.studentId}-${student.courseId}-${index}`}
                            >
                              <div className="student-performance-card-top">
                                <div className="student-performance-avatar">
                                  {String(student.studentName || 'S')
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="student-performance-identity">
                                  <h3>{student.studentName || 'Unnamed student'}</h3>
                                  <p>{student.studentEmail || 'No email available'}</p>
                                </div>

                                <span className="student-performance-score">
                                  {Number(student.averageScore || 0)}%
                                  <small>Average score</small>
                                </span>
                              </div>

                              <div className="student-performance-course">
                                <span>Enrolled course</span>
                                <strong>{student.courseTitle || 'Unknown course'}</strong>
                              </div>

                              <div className="student-performance-stats">
                                <div>
                                  <span>Quiz attempts</span>
                                  <strong>{student.attemptCount ?? 0}</strong>
                                </div>

                                <div>
                                  <span>Average score</span>
                                  <strong>{Number(student.averageScore || 0)}%</strong>
                                </div>
                              </div>

                              <div className="student-performance-progress-track">
                                <div
                                  className="student-performance-progress-fill"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, Number(student.averageScore) || 0)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </article>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              </>
            ) : !user ? (
              <div className="student-empty-state">
                <div className="student-empty-icon">
                  <LogIn size={36} />
                </div>
                <h3>Sign in to view your dashboard</h3>
                <p>Track your enrolled courses, lesson progress, and quiz results.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPage('Sign in')}
                >
                  Sign in
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="student-dashboard-content">
                {/* METRICS OVERVIEW */}
                <div className="student-metrics-grid">
                  <article className="student-metric-card">
                    <div className="metric-icon-wrap blue">
                      <BookOpen size={20} />
                    </div>
                    <div className="metric-info">
                      <span className="student-metric-label">Enrolled Courses</span>
                      <strong>{myCourses.length}</strong>
                      <span className="metric-subtext">Courses in your library</span>
                    </div>
                  </article>

                  <article className="student-metric-card">
                    <div className="metric-icon-wrap green">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="metric-info">
                      <span className="student-metric-label">Courses Completed</span>
                      <strong>{completedCourses.length}</strong>
                      <span className="metric-subtext">100% lessons finished</span>
                    </div>
                  </article>

                  <article className="student-metric-card">
                    <div className="metric-icon-wrap amber">
                      <Clock size={20} />
                    </div>
                    <div className="metric-info">
                      <span className="student-metric-label">In Progress</span>
                      <strong>{inProgressCourses.length}</strong>
                      <span className="metric-subtext">Active learning underway</span>
                    </div>
                  </article>

                  <article className="student-metric-card">
                    <div className="metric-icon-wrap purple">
                      <ClipboardList size={20} />
                    </div>
                    <div className="metric-info">
                      <span className="student-metric-label">Quizzes Completed</span>
                      <strong>{studentQuizAttempts.length}</strong>
                      <span className="metric-subtext">
                        {averageQuizScore !== null
                          ? `${averageQuizScore}% average score`
                          : 'No attempts yet'}
                      </span>
                    </div>
                  </article>

                  <article className="student-metric-card">
                    <div className="metric-icon-wrap gold">
                      <Award size={20} />
                    </div>
                    <div className="metric-info">
                      <span className="student-metric-label">Certificates Earned</span>
                      <strong>{completedCourses.length}</strong>
                      <span className="metric-subtext">Verified certificates</span>
                    </div>
                  </article>
                </div>

                {/* TABS & ACTIONS */}
                <div className="student-dash-nav">
                  <div className="student-dash-tabs">
                    <button
                      type="button"
                      className={`student-dash-tab ${
                        studentDashboardTab === 'all' ? 'active' : ''
                      }`}
                      onClick={() => setStudentDashboardTab('all')}
                    >
                      <BookOpen size={15} />
                      All Courses
                      <span className="tab-count">{myCourses.length}</span>
                    </button>

                    <button
                      type="button"
                      className={`student-dash-tab ${
                        studentDashboardTab === 'in-progress' ? 'active' : ''
                      }`}
                      onClick={() => setStudentDashboardTab('in-progress')}
                    >
                      <Clock size={15} />
                      In Progress
                      <span className="tab-count">{inProgressCourses.length}</span>
                    </button>

                    <button
                      type="button"
                      className={`student-dash-tab ${
                        studentDashboardTab === 'completed' ? 'active' : ''
                      }`}
                      onClick={() => setStudentDashboardTab('completed')}
                    >
                      <CheckCircle2 size={15} />
                      Completed Courses
                      <span className="tab-count">{completedCourses.length}</span>
                    </button>

                    <button
                      type="button"
                      className={`student-dash-tab ${
                        studentDashboardTab === 'quizzes' ? 'active' : ''
                      }`}
                      onClick={() => setStudentDashboardTab('quizzes')}
                    >
                      <ClipboardList size={15} />
                      Quiz Results
                      <span className="tab-count">
                        {studentQuizAttempts.length}
                      </span>
                    </button>
                  </div>

                  <div className="student-dash-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        loadMyLearning();
                        loadStudentQuizAttempts();
                      }}
                      disabled={myCoursesLoading || studentQuizLoading}
                      title="Refresh courses and quiz results"
                    >
                      <RefreshCw
                        size={14}
                        className={
                          myCoursesLoading || studentQuizLoading ? 'spin' : ''
                        }
                      />
                      Refresh
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setPage('Explore')}
                    >
                      <Search size={14} />
                      Explore Courses
                    </button>
                  </div>
                </div>

                {/* MY LEARNING / ENROLLED COURSES VIEW */}
                {studentDashboardTab !== 'quizzes' && (
                  <div className="student-courses-section">
                    <div className="student-section-heading">
                      <div>
                        <span className="eyebrow">MY LEARNING</span>
                        <h2>
                          {studentDashboardTab === 'completed'
                            ? 'Completed Courses'
                            : studentDashboardTab === 'in-progress'
                            ? 'In-Progress Courses'
                            : 'Enrolled Courses'}
                        </h2>
                        <p>
                          {studentDashboardTab === 'completed'
                            ? 'Courses you have 100% completed. Download your verified certificate anytime.'
                            : studentDashboardTab === 'in-progress'
                            ? 'Continue learning lessons where you left off.'
                            : 'All courses you are currently enrolled in with live progress.'}
                        </p>
                      </div>

                      {myCoursesLoading && (
                        <span className="student-loading-pill">
                          Updating courses...
                        </span>
                      )}
                    </div>

                    {!myCoursesLoading && displayedStudentCourses.length === 0 ? (
                      <div className="student-empty-state">
                        <div className="student-empty-icon">
                          {studentDashboardTab === 'completed' ? (
                            <Award size={36} />
                          ) : (
                            <BookOpen size={36} />
                          )}
                        </div>
                        <h3>
                          {studentDashboardTab === 'completed'
                            ? 'No completed courses yet'
                            : studentDashboardTab === 'in-progress'
                            ? 'No courses currently in progress'
                            : 'Your learning journey starts here'}
                        </h3>
                        <p>
                          {studentDashboardTab === 'completed'
                            ? 'Finish all lessons in an enrolled course to view it here and download your certificate.'
                            : studentDashboardTab === 'in-progress'
                            ? 'You have completed all your enrolled courses, or have not enrolled yet.'
                            : "You haven't enrolled in any courses yet. Explore our catalog and start learning!"}
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => setPage('Explore')}
                        >
                          Explore Courses <ArrowRight size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="my-learning-grid">
                        {displayedStudentCourses.map((course) => {
                          const lessons = course.lessons || [];
                          const completedLessons = course.completedLessons || [];
                          const totalLessons = course.totalLessons ?? lessons.length;
                          const validCompletedCount = lessons.filter((l) =>
                            completedLessons.map(String).includes(String(l._id))
                          ).length;
                          const completedCount = Math.min(
                            totalLessons,
                            course.completedCount ?? (validCompletedCount || completedLessons.length)
                          );
                          const progress = totalLessons
                            ? Math.min(
                                100,
                                Math.round((completedCount / totalLessons) * 100)
                              )
                            : 0;
                          const isCompleted = progress === 100;

                          return (
                            <article className="my-learning-card" key={course._id}>
                              <div className="my-learning-card-top">
                                <div
                                  className={`my-learning-course-icon ${
                                    isCompleted ? 'completed-icon' : ''
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Award size={23} />
                                  ) : (
                                    <BookOpen size={23} />
                                  )}
                                </div>
                                <span
                                  className={`my-learning-status ${
                                    isCompleted
                                      ? 'status-completed'
                                      : 'status-progress'
                                  }`}
                                >
                                  {isCompleted ? 'Completed ✓' : 'In Progress'}
                                </span>
                              </div>

                              <div className="my-learning-card-content">
                                <span className="course-card-category">
                                  {course.category || 'General'}
                                </span>
                                <h3>{course.title}</h3>
                                <p className="my-learning-description">
                                  {course.description ||
                                    'Continue learning and building your skills.'}
                                </p>

                                <div className="my-learning-meta">
                                  <span>
                                    Instructor:{' '}
                                    {course.instructor?.name ||
                                      'Instructor not available'}
                                  </span>
                                  <span>
                                    {completedCount} of {totalLessons} lessons
                                    completed
                                  </span>
                                </div>

                                <div
                                  className="my-learning-progress-track"
                                  role="progressbar"
                                  aria-valuenow={progress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  aria-label={`${course.title} completion`}
                                >
                                  <div
                                    className={`my-learning-progress-fill ${
                                      isCompleted ? 'fill-completed' : ''
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>

                                <div className="my-learning-progress-label">
                                  <span>Course progress</span>
                                  <strong>{progress}%</strong>
                                </div>
                              </div>

                              <div className="my-learning-card-footer">
                                {isCompleted ? (
                                  <div className="completed-card-actions">
                                    <button
                                      type="button"
                                      className="btn btn-primary certificate-download-btn"
                                      onClick={() => downloadCertificate(course)}
                                      title="Download Official Certificate (PDF)"
                                    >
                                      <Award size={18} />
                                      Download Certificate
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-secondary review-course-btn"
                                      onClick={() => {
                                        setSelectedCourse(course);
                                        setPage('Course Details');
                                      }}
                                    >
                                      Review Course
                                      <ArrowRight size={15} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      setPage('Course Details');
                                    }}
                                  >
                                    Continue Learning
                                    <ArrowRight size={16} />
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* QUIZ COMPLETION & RESULT DATA SECTION */}
                {(studentDashboardTab === 'quizzes' ||
                  (studentDashboardTab === 'all' &&
                    studentQuizAttempts.length > 0)) && (
                  <div className="student-quiz-section">
                    <div className="student-section-heading">
                      <div>
                        <span className="eyebrow">ASSESSMENT PERFORMANCE</span>
                        <h2>Quiz Completion & Results</h2>
                        <p>
                          Review your submitted quizzes, scores, accuracy, and
                          completion details.
                        </p>
                      </div>

                      {studentQuizAttempts.length > 0 && (
                        <div className="quiz-summary-badges">
                          <span className="quiz-badge-item passed">
                            {passedQuizzesCount} Passed
                          </span>
                          <span className="quiz-badge-item total">
                            {totalAttemptsCount} Attempted
                          </span>
                        </div>
                      )}
                    </div>

                    {studentQuizLoading ? (
                      <p className="student-dash-message">
                        Loading quiz results...
                      </p>
                    ) : studentQuizAttempts.length === 0 ? (
                      <div className="student-empty-state">
                        <div className="student-empty-icon">
                          <ClipboardList size={36} />
                        </div>
                        <h3>No quiz results yet</h3>
                        <p>
                          Quizzes are available in your enrolled courses.
                          Complete assessments to test your knowledge and see
                          your performance data here.
                        </p>
                      </div>
                    ) : (
                      <div className="student-quiz-grid">
                        {studentQuizAttempts.map((attempt) => (
                          <article
                            className="student-quiz-card"
                            key={attempt._id}
                          >
                            <div className="student-quiz-card-top">
                              <span className="quiz-course-tag">
                                {attempt.courseTitle}
                              </span>

                              <span
                                className={`quiz-result-pill ${
                                  attempt.passed ? 'passed' : 'needs-review'
                                }`}
                              >
                                {attempt.passed ? (
                                  <>
                                    <CheckCircle2 size={13} />
                                    Passed ({attempt.percentage}%)
                                  </>
                                ) : (
                                  <>
                                    <Clock size={13} />
                                    Needs Review ({attempt.percentage}%)
                                  </>
                                )}
                              </span>
                            </div>

                            <div className="student-quiz-card-body">
                              <h3>{attempt.quizTitle}</h3>
                              <p className="quiz-instructor-text">
                                Instructor: {attempt.instructorName}
                              </p>

                              <div className="quiz-score-display">
                                <div className="quiz-score-numbers">
                                  <span className="score-label">Score</span>
                                  <strong>
                                    {attempt.score}{' '}
                                    <small>/ {attempt.total}</small>
                                  </strong>
                                </div>

                                <div className="quiz-score-pct">
                                  <span>Accuracy</span>
                                  <strong>{attempt.percentage}%</strong>
                                </div>
                              </div>

                              <div className="quiz-score-bar-track">
                                <div
                                  className={`quiz-score-bar-fill ${
                                    attempt.passed
                                      ? 'fill-passed'
                                      : 'fill-review'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, attempt.percentage)
                                    )}%`,
                                  }}
                                />
                              </div>

                              {attempt.submittedAt && (
                                <div className="quiz-submitted-time">
                                  <Clock size={12} />
                                  <span>
                                    Submitted{' '}
                                    {new Date(
                                      attempt.submittedAt
                                    ).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}{' '}
                                    at{' '}
                                    {new Date(
                                      attempt.submittedAt
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="student-quiz-card-footer">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  const course =
                                    myCourses.find(
                                      (c) =>
                                        String(c._id) ===
                                        String(attempt.courseId)
                                    ) ||
                                    courses.find(
                                      (c) =>
                                        String(c._id) ===
                                        String(attempt.courseId)
                                    );

                                  if (course) {
                                    setSelectedCourse(course);
                                    setPage('Course Details');
                                    loadQuizzes(course._id);
                                  } else {
                                    setPage('Explore');
                                  }
                                }}
                              >
                                Review in Course
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

      </main>

      {/* CREATE COURSE MODAL */}

      {modal && (
        <div
          className="modal-backdrop"
          onClick={() => setModal(false)}
        >
          <form
            className="modal"
            onSubmit={createCourse}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setModal(false)}
            >
              ×
            </button>

            <span className="eyebrow">INSTRUCTOR STUDIO</span>

            <h2>Create a course</h2>

            <label>
              Course title

              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Description

              <textarea
                required
                rows="3"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </label>

            <div className="form-row">
              <label>
                Category

                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Price (₹)

                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>

            <button className="btn btn-primary full" type="submit">
              Publish course <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}