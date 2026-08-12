module.exports = {
  ROLES: {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    STUDENT: 'student',
  },
  SUBMISSION_STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    GRADED: 'graded',
  },
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
  },
  ATTENDANCE_METHOD: {
    FACE: 'face',
    MANUAL: 'manual',
  },
  TEST_ATTEMPT_STATUS: {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    TIMED_OUT: 'timed_out',
  },
  ARCHIVE_FILE_TYPES: ['pdf', 'docx', 'pptx', 'png'],
  MAX_HISTORY_STEPS: 50,
  FACE_CONFIDENCE_THRESHOLD: 0.85,
};
