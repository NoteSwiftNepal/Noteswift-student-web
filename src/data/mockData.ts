export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarEmoji: string;
  rollNo: number;
  grade: string;
  schoolName: string;
  stream: string; // "SEE" | "+2" | "Bachelor" | "CTEVT"
  gpa: number;
  attendancePercent: number;
  weeklyStudyHours: number;
  streakCount: number;
  address?: {
    province?: string;
    district?: string;
    institution?: string;
  };
  avatar?: string;
  profileImage?: string | null;
  linkingCode?: string;
  parentLinked?: boolean;
  parentName?: string | null;
  parentNames?: string[];
}

export interface TimetableClass {
  id: string;
  subject: string;
  time: string;
  teacherName: string;
  status: "scheduled" | "completed" | "ongoing" | "cancelled";
  room: string;
}

export interface SyllabusItem {
  moduleNumber: number;
  title: string;
  description: string;
}

export interface LessonContent {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string; // signed URL stub
  notesUrl?: string; // signed URL stub
  worksheetUrl?: string;
  isCompleted: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: LessonContent[];
}

export interface SubjectContent {
  name: string;
  chapters: Chapter[];
}

export interface Course {
  id: string;
  _id: string;
  title: string;
  description: string;
  subjects: {
    name: string;
    icon?: string;
  }[];
  tags: string[];
  status: string;
  type: "featured" | "pro" | "free" | "recommended" | "upcoming";
  offeredBy: string;
  rating: number;
  enrolledCount: number;
  program: string;
  price: number;
  courseOverview: string;
  keyFeatures: string[];
  syllabus: SyllabusItem[];
  faq: { question: string; answer: string }[];
  thumbnail?: string;
  gradient?: string;
  color?: string;
  themeColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id: string;
  _id: string;
  courseId: string | Course;
  studentId: string;
  enrolledAt: string;
  progress: number;
  isActive: boolean;
  lastAccessedAt: string;
  completedLessons: string[]; // lessonIds
}

export interface TrialEnrollment {
  id: string;
  _id: string;
  courseId: string | Course;
  studentId: string;
  trialStartedAt: string;
  trialExpiresAt: string;
  isActive: boolean;
  progress: number;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  submissionStatus: "pending" | "submitted" | "late";
  score?: string;
  submittedAt?: string;
  attachmentUrl?: string;
  textAnswer?: string;
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "leave";
  reason?: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion {
  id: string;
  text: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation: string;
}

export interface MockTest {
  id: string;
  subject: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  classAverage: number;
  type: "mcq" | "pdf";
  pdfUrl?: string;
  questions?: MCQQuestion[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  attemptedAt: string;
  score: number;
  totalMarks: number;
  answers: { [questionId: string]: string }; // questionId -> selectedOptionId
  completed: boolean;
  timeSpentSeconds: number;
}

export interface DoubtAnswer {
  id: string;
  authorName: string;
  authorRole: "teacher" | "student";
  text: string;
  createdAt: string;
  isAccepted: boolean;
}

export interface DoubtQuestion {
  id: string;
  title: string;
  text: string;
  subject: string;
  courseId?: string;
  status: "pending" | "resolved";
  studentId: string;
  studentName: string;
  studentAvatar: string;
  tags: string[];
  upvotes: number;
  voted?: "up" | "down";
  answers: DoubtAnswer[];
  createdAt: string;
}

export interface Message {
  id: string;
  sender: "student" | "teacher";
  text: string;
  timestamp: string;
}

export interface TeacherChatThread {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  messages: Message[];
}

export interface AIChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface AIChatHistory {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  category: "exam" | "event" | "general" | "academic";
  isRead: boolean;
}

export interface Invoice {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending";
  datePaid?: string;
}

export interface MockDatabase {
  student: StudentProfile;
  timetable: TimetableClass[];
  courses: Course[];
  enrollments: CourseEnrollment[];
  trials: TrialEnrollment[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  tests: MockTest[];
  testAttempts: TestAttempt[];
  doubts: DoubtQuestion[];
  chats: TeacherChatThread[];
  aiHistory: AIChatHistory[];
  notifications: Notification[];
  invoices: Invoice[];
  subjectContents: { [subjectName: string]: SubjectContent };
}

// Helper to generate Nepalese student attendance for the past 30 days (excluding Saturdays)
const generateStudentAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  for (let i = 30; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 6) continue; // Saturday is weekend in Nepal
    
    const rand = Math.random();
    let status: "present" | "absent" | "late" | "leave" = "present";
    let reason: string | undefined = undefined;
    
    if (rand > 0.94) {
      status = "absent";
      reason = "Fever / Sick leave";
    } else if (rand > 0.88) {
      status = "late";
      reason = "Public transport delay";
    }
    
    records.push({
      date: d.toISOString().split("T")[0],
      status,
      reason,
    });
  }
  return records;
};

export const initialMockDatabase: MockDatabase = {
  student: {
    id: "s123",
    email: "ram.thapa@student.example.com",
    fullName: "Ram Thapa",
    phoneNumber: "+977-9841234567",
    avatarEmoji: "🎒",
    rollNo: 12,
    grade: "Grade 10 (Section A)",
    schoolName: "NoteSwift Secondary School",
    stream: "SEE",
    gpa: 3.82,
    attendancePercent: 93.5,
    weeklyStudyHours: 18.5,
    streakCount: 5,
  },
  timetable: [
    { id: "tt-1", subject: "Mathematics", time: "09:30 AM - 10:30 AM", teacherName: "Mr. Kiran Adhikari", status: "completed", room: "Room 101" },
    { id: "tt-2", subject: "Science", time: "10:45 AM - 11:45 AM", teacherName: "Ms. Sarita Thapa", status: "completed", room: "Room 101" },
    { id: "tt-3", subject: "English", time: "12:15 PM - 01:15 PM", teacherName: "Mr. Dev Raj Giri", status: "ongoing", room: "Lab B" },
    { id: "tt-4", subject: "Nepali", time: "01:30 PM - 02:30 PM", teacherName: "Mrs. Kopila Lamichhane", status: "scheduled", room: "Room 101" },
    { id: "tt-5", subject: "Social Studies", time: "02:45 PM - 03:45 PM", teacherName: "Mr. Ramesh Karki", status: "scheduled", room: "Room 101" },
  ],
  courses: [
    {
      id: "course-math-10",
      _id: "course-math-10",
      title: "SEE Grade 10 Mathematics Complete Guide",
      description: "Comprehensive guide for SEE compulsory mathematics including algebra, arithmetic, trigonometry, geometry, and statistics.",
      subjects: [{ name: "Mathematics", icon: "Calculator" }],
      tags: ["SEE", "Math", "Compulsory"],
      status: "published",
      type: "featured",
      offeredBy: "NoteSwift Academy",
      rating: 4.8,
      enrolledCount: 1540,
      program: "SEE",
      price: 2500,
      courseOverview: "Master compulsory math for SEE exams. This course contains 50+ video lectures, exhaustive notes for every lesson, and 100+ quiz questions covering all key topics.",
      keyFeatures: ["50+ detailed video lessons", "Full formula reference cards", "MCQ practice modules", "Doubt clearance priority support"],
      syllabus: [
        { moduleNumber: 1, title: "Sets & Arithmetic", description: "Review set operations, Venn diagrams, compound interest, and population growth." },
        { moduleNumber: 2, title: "Mensuration", description: "Calculating area, volume, and total surface area of cylinders, spheres, cones, and prisms." },
        { moduleNumber: 3, title: "Algebra", description: "Indices, quadratic equations, surds, and algebraic fractions." },
        { moduleNumber: 4, title: "Trigonometry & Geometry", description: "Heights and distances, trigonometric ratios, theorem proofs, and constructions." },
      ],
      faq: [
        { question: "Is this course aligned with the CDC Nepal syllabus?", answer: "Yes, it is strictly updated and structured according to the latest Curriculum Development Centre (CDC) of Nepal guidelines." },
        { question: "Can I download notes for offline study?", answer: "Yes, PDF versions of chapter notes and formula lists are available for download." }
      ],
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-06-01T00:00:00Z",
    },
    {
      id: "course-science-10",
      _id: "course-science-10",
      title: "SEE Grade 10 Science & Technology Masterclass",
      description: "Unlock core concepts in physics, chemistry, biology, and astronomy with realistic interactive experiments and mock exams.",
      subjects: [{ name: "Science", icon: "Beaker" }],
      tags: ["SEE", "Science", "Technology"],
      status: "published",
      type: "recommended",
      offeredBy: "NoteSwift Academy",
      rating: 4.9,
      enrolledCount: 1980,
      program: "SEE",
      price: 3000,
      courseOverview: "Master secondary Science for SEE. Designed to build deep conceptual clarity, this course covers all topics in gravity, electricity, chemical reactions, metal metallurgy, heredity, and environmental ecology.",
      keyFeatures: ["High-definition animation layouts", "Formula cheatsheets", "Past paper questions solved step-by-step", "Interactive mock test reviews"],
      syllabus: [
        { moduleNumber: 1, title: "Physics", description: "Force and gravity, pressure, energy, heat, light reflection, and current electricity." },
        { moduleNumber: 2, title: "Chemistry", description: "Chemical reaction balancing, periodic table trends, acids, bases, salts, gases, and metallurgy." },
        { moduleNumber: 3, title: "Biology", description: "Life processes, nervous and endocrine systems, blood circulation, cell division, and heredity." },
        { moduleNumber: 4, title: "Geology & Astronomy", description: "Structure of Earth, history, atmosphere, and space exploration." },
      ],
      faq: [
        { question: "Are practical experiment descriptions covered?", answer: "Yes, all major laboratory experiments required for SEE practicals are simulated and explained in detail." }
      ],
      createdAt: "2026-01-20T00:00:00Z",
      updatedAt: "2026-06-15T00:00:00Z",
    },
    {
      id: "course-english-10",
      _id: "course-english-10",
      title: "SEE Compulsory English Reading & Grammar Course",
      description: "Improve writing structures, grammar accuracy, reading comprehension, and master literature summaries for SEE.",
      subjects: [{ name: "English", icon: "Book" }],
      tags: ["SEE", "English", "Compulsory"],
      status: "published",
      type: "free",
      offeredBy: "NoteSwift Academy",
      rating: 4.6,
      enrolledCount: 3120,
      program: "SEE",
      price: 0,
      courseOverview: "Free access to English grammar, letter writing formats, summaries of all literature lessons, and guided reading comprehension tasks.",
      keyFeatures: ["All grammar topics covered in brief", "Summary notes of all 18 literature lessons", "Mock letter writing templates", "10 full length practice sets"],
      syllabus: [
        { moduleNumber: 1, title: "Grammar Core", description: "Tenses, active/passive, reported speech, tag questions, preposition usage." },
        { moduleNumber: 2, title: "Reading & Writing", description: "Unseen pass comprehension, job application letters, formal essays, news stories." },
        { moduleNumber: 3, title: "Literature Summaries", description: "Short stories, poems, dramas, and character sketches parsed simply." },
      ],
      faq: [
        { question: "Is this course completely free?", answer: "Yes! NoteSwift provides free access to Compulsory English tutorials to help students improve basic literacy and exam prep." }
      ],
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-05-10T00:00:00Z",
    }
  ],
  enrollments: [
    {
      id: "enr-1",
      _id: "enr-1",
      courseId: "course-math-10",
      studentId: "s123",
      enrolledAt: "2026-05-01T08:00:00Z",
      progress: 60,
      isActive: true,
      lastAccessedAt: "2026-07-03T09:30:00Z",
      completedLessons: ["les-math-1-1", "les-math-1-2", "les-math-2-1", "les-math-2-2"]
    },
    {
      id: "enr-2",
      _id: "enr-2",
      courseId: "course-science-10",
      studentId: "s123",
      enrolledAt: "2026-05-15T09:00:00Z",
      progress: 25,
      isActive: true,
      lastAccessedAt: "2026-07-03T11:15:00Z",
      completedLessons: ["les-sci-1-1", "les-sci-1-2"]
    }
  ],
  trials: [],
  assignments: [
    {
      id: "as-1",
      subject: "Science",
      title: "Gravitational Acceleration (g) calculation report",
      description: "Write a lab report detailing the calculation of gravitational acceleration on different planets. Submit in PDF format.",
      dueDate: "2026-07-04",
      submissionStatus: "pending",
    },
    {
      id: "as-2",
      subject: "Mathematics",
      title: "Trigonometry Height and Distances worksheet",
      description: "Complete all questions from Section B of the Trigonometry practice workbook.",
      dueDate: "2026-06-28",
      submissionStatus: "submitted",
      score: "18/20",
      submittedAt: "2026-06-27T16:00:00Z",
      attachmentUrl: "/assets/math_trig_sub.pdf",
    },
    {
      id: "as-3",
      subject: "English",
      title: "Write an essay on 'Impacts of climate change in Nepal'",
      description: "Write a 300-word formal essay on the environmental and economic effects of climate change in Nepal.",
      dueDate: "2026-07-02",
      submissionStatus: "submitted",
      submittedAt: "2026-07-01T15:30:00Z",
      textAnswer: "Climate change is a pressing concern for a mountainous nation like Nepal. Over the past few decades, the rate of temperature rise has led to melting glaciers, glacial lake outburst floods (GLOFs), and erratic rainfall patterns..."
    },
    {
      id: "as-4",
      subject: "Social Studies",
      title: "Historical timeline of Nepal's unification",
      description: "Construct a chronologically sorted vertical timeline listing key battles and milestones of Prithvi Narayan Shah's unification campaign.",
      dueDate: "2026-06-20",
      submissionStatus: "late",
      score: "14/20",
      submittedAt: "2026-06-22T08:00:00Z",
      textAnswer: "The unification of Nepal began in 1744 AD when King Prithvi Narayan Shah of Gorkha conquered Nuwakot. Over the next few decades, key battles were fought in Kirtipur, Kathmandu, Lalitpur, and Bhaktapur..."
    }
  ],
  attendance: generateStudentAttendance(),
  tests: [
    {
      id: "test-math-mcq-1",
      subject: "Mathematics",
      title: "SEE Trigonometry Heights and Angles Test",
      durationMinutes: 20,
      totalMarks: 20,
      classAverage: 14.5,
      type: "mcq",
      questions: [
        {
          id: "q-1",
          text: "If the angle of elevation of the sun is 45°, then the height of a vertical pole and the length of its shadow on flat ground are:",
          options: [
            { id: "o-1-1", text: "Height is greater than shadow length" },
            { id: "o-1-2", text: "Height is less than shadow length" },
            { id: "o-1-3", text: "Height and shadow length are equal" },
            { id: "o-1-4", text: "No relation exists" }
          ],
          correctOptionId: "o-1-3",
          explanation: "Since tan(45°) = Height / Shadow length = 1, we get Height = Shadow length. Thus, they are equal."
        },
        {
          id: "q-2",
          text: "What is the value of sin²(30°) + cos²(30°)?",
          options: [
            { id: "o-2-1", text: "0.5" },
            { id: "o-2-2", text: "1" },
            { id: "o-2-3", text: "1.5" },
            { id: "o-2-4", text: "2" }
          ],
          correctOptionId: "o-2-2",
          explanation: "According to the fundamental trigonometric identity, sin²θ + cos²θ = 1 for any angle θ."
        },
        {
          id: "q-3",
          text: "A ladder 20m long reaches a window 10m high. The angle made by the ladder with the horizontal is:",
          options: [
            { id: "o-3-1", text: "30°" },
            { id: "o-3-2", text: "45°" },
            { id: "o-3-3", text: "60°" },
            { id: "o-3-4", text: "90°" }
          ],
          correctOptionId: "o-3-1",
          explanation: "sin θ = opposite / hypotenuse = 10 / 20 = 0.5. Since sin(30°) = 0.5, the angle is 30°."
        }
      ]
    },
    {
      id: "test-sci-mcq-1",
      subject: "Science",
      title: "Heredity & Cell Division MCQ Quiz",
      durationMinutes: 15,
      totalMarks: 15,
      classAverage: 11.2,
      type: "mcq",
      questions: [
        {
          id: "qs-1",
          text: "Which of the following cell divisions results in the formation of gametes?",
          options: [
            { id: "os-1-1", text: "Mitosis" },
            { id: "os-1-2", text: "Meiosis" },
            { id: "os-1-3", text: "Amitosis" },
            { id: "os-1-4", text: "Fission" }
          ],
          correctOptionId: "os-1-2",
          explanation: "Meiosis is a reductional cell division that produces haploid gametes (sperm and egg cells) for sexual reproduction."
        },
        {
          id: "qs-2",
          text: "Who is known as the father of genetics?",
          options: [
            { id: "os-2-1", text: "Charles Darwin" },
            { id: "os-2-2", text: "Gregor Mendel" },
            { id: "os-2-3", text: "Jean-Baptiste Lamarck" },
            { id: "os-2-4", text: "Watson and Crick" }
          ],
          correctOptionId: "os-2-2",
          explanation: "Gregor Mendel discovered the fundamental laws of inheritance through his experiments on pea plants."
        }
      ]
    },
    {
      id: "test-math-pdf-1",
      subject: "Mathematics",
      title: "SEE Mathematics Practice Set - 1",
      durationMinutes: 180,
      totalMarks: 100,
      classAverage: 65,
      type: "pdf",
      pdfUrl: "/assets/see_math_practice_set1.pdf"
    }
  ],
  testAttempts: [
    {
      id: "att-1",
      testId: "test-math-mcq-1",
      studentId: "s123",
      attemptedAt: "2026-06-25T14:00:00Z",
      score: 13.5, // 2 out of 3 correct + 0.5 step score (simulated)
      totalMarks: 20,
      answers: {
        "q-1": "o-1-3", // correct
        "q-2": "o-2-2", // correct
        "q-3": "o-3-3"  // wrong (selected 60 instead of 30)
      },
      completed: true,
      timeSpentSeconds: 310
    }
  ],
  doubts: [
    {
      id: "dbt-1",
      title: "Quadratic equations solving by completing square",
      text: "I am having trouble understanding the algebraic rearrangement step when completing the square for ax² + bx + c = 0. Can someone explain where the (b/2a)² comes from?",
      subject: "Mathematics",
      courseId: "course-math-10",
      status: "resolved",
      studentId: "s123",
      studentName: "Ram Thapa",
      studentAvatar: "🎒",
      tags: ["Algebra", "Quadratic Equations"],
      upvotes: 4,
      voted: "up",
      createdAt: "2026-06-28T09:00:00Z",
      answers: [
        {
          id: "ans-1",
          authorName: "Mr. Kiran Adhikari",
          authorRole: "teacher",
          text: "To complete the square for ax² + bx + c = 0, first divide the equation by a: x² + (b/a)x + (c/a) = 0. We want to convert x² + (b/a)x into a perfect square trinomial (x + d)² = x² + 2dx + d². Comparing terms: 2d = b/a => d = b/2a. Thus, the missing square term is d² = (b/2a)². We add and subtract this to preserve the equation.",
          createdAt: "2026-06-28T11:30:00Z",
          isAccepted: true
        }
      ]
    },
    {
      id: "dbt-2",
      title: "What is the escape velocity of Earth?",
      text: "I read that escape velocity is the speed required to break free from Earth's gravitational pull. How is the value 11.2 km/s mathematically derived?",
      subject: "Science",
      courseId: "course-science-10",
      status: "pending",
      studentId: "s123",
      studentName: "Ram Thapa",
      studentAvatar: "🎒",
      tags: ["Gravity", "Physics"],
      upvotes: 2,
      createdAt: "2026-07-02T10:00:00Z",
      answers: []
    }
  ],
  chats: [
    {
      id: "ch-math",
      teacherId: "t-1",
      teacherName: "Mr. Kiran Adhikari",
      subject: "Mathematics",
      messages: [
        { id: "m-1", sender: "teacher", text: "Hello Ram, I reviewed your mock test result. You did great in Algebra, but make sure to practice geometry proofs.", timestamp: "2026-07-02T10:00:00Z" },
        { id: "m-2", sender: "student", text: "Thank you, sir. I will practice theorem 3 and 4 this evening and message you if I get stuck.", timestamp: "2026-07-02T10:15:00Z" },
        { id: "m-3", sender: "teacher", text: "Sounds good! Good luck.", timestamp: "2026-07-02T10:20:00Z" }
      ]
    },
    {
      id: "ch-sci",
      teacherId: "t-2",
      teacherName: "Ms. Sarita Thapa",
      subject: "Science",
      messages: [
        { id: "m-4", sender: "teacher", text: "Ram, don't forget to submit your lab report on gravity by tomorrow evening.", timestamp: "2026-07-03T08:00:00Z" },
        { id: "m-5", sender: "student", text: "Yes, Ms. Thapa. I am finalising the calculation tables and will upload the PDF today.", timestamp: "2026-07-03T08:45:00Z" }
      ]
    }
  ],
  aiHistory: [
    {
      id: "chat-ai-1",
      title: "Trigonometric Formulas Refresher",
      createdAt: "2026-07-01T16:00:00Z",
      messages: [
        { id: "aim-1", role: "user", content: "Tell me all the compounding formulas for trigonometry.", timestamp: "2026-07-01T16:00:00Z" },
        { id: "aim-2", role: "model", content: "Here are the key compound angle formulas:\n1. sin(A + B) = sin A cos B + cos A sin B\n2. sin(A - B) = sin A cos B - cos A sin B\n3. cos(A + B) = cos A cos B - sin A sin B\n4. cos(A - B) = cos A cos B + sin A sin B\n5. tan(A + B) = (tan A + tan B) / (1 - tan A tan B)", timestamp: "2026-07-01T16:01:00Z" }
      ]
    }
  ],
  notifications: [
    { id: "not-1", title: "First Terminal Exam Routine Released", content: "The First Terminal Examinations schedule has been posted. The exams will run from July 10 to July 18, 2026.", date: "2026-07-01", category: "exam", isRead: false },
    { id: "not-2", title: "Science Project Due Date Reminder", content: "Don't forget to submit your Gravity Lab Report by tomorrow (July 4). Late submissions will be graded out of 80% maximum.", date: "2026-07-03", category: "academic", isRead: false },
    { id: "not-3", title: "PTA Meeting Postponed", content: "The PTA meeting scheduled for Friday has been postponed by one week due to heavy monsoon rains.", date: "2026-06-30", category: "event", isRead: true }
  ],
  invoices: [
    { id: "INV-STU-001", description: "Grade 10 Annual Enrolment & Registration Dues", amount: 15000, dueDate: "2026-05-15", status: "paid", datePaid: "2026-05-10" },
    { id: "INV-STU-002", description: "Compulsory Math Course Unlock (Full access)", amount: 2500, dueDate: "2026-06-01", status: "paid", datePaid: "2026-05-25" },
    { id: "INV-STU-003", description: "Science Masterclass Subscription (Term 1)", amount: 3000, dueDate: "2026-06-30", status: "pending" }
  ],
  subjectContents: {
    "Mathematics": {
      name: "Mathematics",
      chapters: [
        {
          id: "ch-math-1",
          title: "Algebraic Equations",
          description: "Understanding quadratic formula derivations and solving techniques.",
          lessons: [
            { id: "les-math-1-1", title: "Quadratic Roots Concept", duration: "12 mins", videoUrl: "http://example.com/math-quad-1", notesUrl: "http://example.com/math-quad-1-notes.pdf", isCompleted: true },
            { id: "les-math-1-2", title: "Completing the Square Method", duration: "18 mins", videoUrl: "http://example.com/math-quad-2", notesUrl: "http://example.com/math-quad-2-notes.pdf", isCompleted: true },
            { id: "les-math-1-3", title: "Word Problems Solving", duration: "25 mins", videoUrl: "http://example.com/math-quad-3", notesUrl: "http://example.com/math-quad-3-notes.pdf", isCompleted: false },
          ]
        },
        {
          id: "ch-math-2",
          title: "Trigonometry Basics",
          description: "Introduction to angles, ratios, and height calculations.",
          lessons: [
            { id: "les-math-2-1", title: "Trigonometric Ratios and Tables", duration: "15 mins", videoUrl: "http://example.com/math-trig-1", notesUrl: "http://example.com/math-trig-1-notes.pdf", isCompleted: true },
            { id: "les-math-2-2", title: "Heights and Distances Introduction", duration: "22 mins", videoUrl: "http://example.com/math-trig-2", notesUrl: "http://example.com/math-trig-2-notes.pdf", isCompleted: true },
            { id: "les-math-2-3", title: "Complex Angles & Triangles", duration: "30 mins", videoUrl: "http://example.com/math-trig-3", notesUrl: "http://example.com/math-trig-3-notes.pdf", isCompleted: false },
          ]
        }
      ]
    },
    "Science": {
      name: "Science",
      chapters: [
        {
          id: "ch-sci-1",
          title: "Force & Gravity",
          description: "Laws of gravitation, acceleration due to gravity, and terminal speed.",
          lessons: [
            { id: "les-sci-1-1", title: "Newton's Universal Law of Gravitation", duration: "14 mins", videoUrl: "http://example.com/sci-grav-1", notesUrl: "http://example.com/sci-grav-1-notes.pdf", isCompleted: true },
            { id: "les-sci-1-2", title: "Acceleration Due to Gravity (g)", duration: "20 mins", videoUrl: "http://example.com/sci-grav-2", notesUrl: "http://example.com/sci-grav-2-notes.pdf", isCompleted: true },
            { id: "les-sci-1-3", title: "Mass vs Weight and Freefall", duration: "18 mins", videoUrl: "http://example.com/sci-grav-3", notesUrl: "http://example.com/sci-grav-3-notes.pdf", isCompleted: false },
          ]
        }
      ]
    }
  }
};
