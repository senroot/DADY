
// ...
// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      SEND_OTP: '/auth/sendotp',
      // Nouveaux endpoints pour le flow sécurisé
      SEND_REGISTRATION_OTP: '/auth/send-registration-otp',
      SIGNUP_WITH_OTP: '/auth/signup-with-otp',
      CREATE_SECRET_CODE: '/auth/create-secret-code',
      VERIFY_SECRET_CODE: '/auth/verify-secret-code',
      USER_STATUS: '/auth/user-status',
      ME: '/auth/me', // Ajouté pour le refresh user
    },
    PARENT: {
      GET_CHILDREN: '/parent/children',
      CREATE_STUDENT: '/parent/create-student',
      CHILD_PROGRESS: '/parent/child-progress',
      LINK_CHILD: '/parent/link-child',
      PURCHASE_FOR_CHILD: '/parent/purchase-for-child',
      GET_CHILD_DETAILED_PROGRESS: '/parent/child/:childId/detailed-progress',
    },
    STUDENT: {
      PROGRESS: '/student/progress',
      COURSE_PROGRESSION: '/student/course-progression',
      COURSES: '/student/courses',
      COURSE_DETAILS: '/student/course-details',
      MARK_ATTENDANCE: '/student/mark-attendance',
      COMPLETE_LESSON: '/student/complete-lesson',
    },
    NOTIFICATIONS: {
      GET_ALL: '/notification',
      GET_UNREAD: '/notification?unreadOnly=true',
      GET_UNREAD_COUNT: '/notification/unread-count',
      MARK_READ: '/notification/:notificationId/read',
      MARK_ALL_READ: '/notification/mark-all-read',
    },
    FORUM: {
      GET_POSTS: '/forum/threads',
      CREATE_POST: '/forum/threads',
      GET_POST: '/forum/threads',
      GET_THREAD: '/forum/threads/:threadId',
      ADD_COMMENT: '/forum/threads/:postId/messages',
      LIKE_POST: '/forum/messages/:messageId/like',
      GET_STATS: '/forum/stats',
      GET_OPTIONS: '/forum/options', // Nouveau endpoint pour récupérer les options
    },
    DISCUSSIONS: {
      GET_ALL: '/discussion/all',
      GET_CONVERSATION: '/discussion/:conversationId',
      SEND_MESSAGE: '/discussion/send-message',
      CREATE_CONVERSATION: '/discussion/create-conversation',
    },
    COURSES: {
      GET_ALL: '/course/courses',
      GET_BY_ID: '/course',
      GET_SECTIONS: '/course/:courseId/sections',
    },
    EXERCISES: {
      GET_ALL: '/exercise/exercises',
      GET_BY_ID: '/exercise',
      START: '/exercise/:exerciseId/start',
      SUBMIT: '/exercise/:exerciseId/submit',
    },
  },
  TIMEOUT: 10000, // 10 seconds
};

// Stockage et récupération du token utilisateur (AsyncStorage)

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

