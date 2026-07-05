import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SubmissionData {
  testTitle: string;
  testType: string;
  studentName?: string;
  studentEmail?: string;
  totalScore?: number;
  totalMarks?: number;
  submittedAt?: string;
  timeSpent?: number;
  answers?: any[];
  module?: string;
  subject?: string;
}

export interface TestResultsData {
  testTitle: string;
  testType: string;
  subject?: string;
  totalAttempts: number;
  evaluatedAttempts: number;
  averageScore: number;
  passRate: number;
  duration?: number;
  totalQuestions?: number;
  attempts: any[];
}

/**
 * Generate PDF for individual submission
 */
export async function generateSubmissionPDF(submission: SubmissionData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Submission Report', margin, currentY);
  currentY += 15;

  // Test Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Information', margin, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`Test Title: ${submission.testTitle}`, margin, currentY);
  currentY += 8;
  pdf.text(`Type: ${submission.testType?.toUpperCase()}`, margin, currentY);
  currentY += 8;
  if (submission.subject) {
    pdf.text(`Subject: ${submission.subject}`, margin, currentY);
    currentY += 8;
  }
  if (submission.module) {
    pdf.text(`Module: ${submission.module}`, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Student Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Student Information', margin, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  const studentName = submission.studentName || submission.studentEmail || 'Unknown Student';
  pdf.text(`Student: ${studentName}`, margin, currentY);
  currentY += 8;
  if (submission.studentEmail && submission.studentEmail !== studentName) {
    pdf.text(`Email: ${submission.studentEmail}`, margin, currentY);
    currentY += 8;
  }
  if (submission.submittedAt) {
    const submittedDate = new Date(submission.submittedAt).toLocaleString();
    pdf.text(`Submitted: ${submittedDate}`, margin, currentY);
    currentY += 8;
  }
  if (submission.timeSpent) {
    const minutes = Math.floor(submission.timeSpent / 60);
    pdf.text(`Time Taken: ${minutes} minutes`, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Performance Summary
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Summary', margin, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  if (submission.totalScore !== undefined && submission.totalMarks) {
    const percentage = Math.round((submission.totalScore / submission.totalMarks) * 100);
    pdf.text(`Score: ${submission.totalScore}/${submission.totalMarks} (${percentage}%)`, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Answers Section
  if (submission.answers && submission.answers.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Answers Review', margin, currentY);
    currentY += 10;

    submission.answers.forEach((answer: any, index: number) => {
      // Check if we need a new page for this question
      const questionHeight = 40 + (answer.questionText?.length || 0) * 0.5;
      checkNewPage(questionHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Question ${index + 1}:`, margin, currentY);
      currentY += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      currentY = addWrappedText(
        answer.questionText || 'Question text not available',
        margin + 5,
        currentY,
        pageWidth - margin * 2 - 5,
        11
      );
      currentY += 5;

      // Selected Answer
      pdf.setFont('helvetica', 'bold');
      pdf.text('Selected Answer:', margin + 5, currentY);
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      const selectedAnswer = answer.selectedAnswer || 'Not answered';
      currentY = addWrappedText(selectedAnswer, margin + 10, currentY, pageWidth - margin * 2 - 10, 10);
      currentY += 3;

      // Correct Answer (if available)
      if (answer.correctAnswer) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Correct Answer:', margin + 5, currentY);
        currentY += 6;
        pdf.setFont('helvetica', 'normal');
        currentY = addWrappedText(answer.correctAnswer, margin + 10, currentY, pageWidth - margin * 2 - 10, 10);
        currentY += 3;
      }

      // Status
      const isCorrect = answer.isCorrect;
      pdf.setFont('helvetica', 'bold');
      if (isCorrect) {
        pdf.setTextColor(0, 128, 0); // Green for correct
      } else {
        pdf.setTextColor(255, 0, 0); // Red for incorrect
      }
      pdf.text(isCorrect ? '✓ Correct' : '✗ Incorrect', margin + 5, currentY);
      pdf.setTextColor(0, 0, 0); // Reset to black
      currentY += 8;

      // Marks
      if (answer.marks !== undefined) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Marks: ${answer.marks}`, margin + 5, currentY);
        currentY += 12;
      }
    });
  }

  // Footer
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10);
  }

  // Download the PDF
  const fileName = `${submission.testTitle.replace(/[^a-z0-9]/gi, '_')}_${studentName.replace(/[^a-z0-9]/gi, '_')}_submission.pdf`;
  pdf.save(fileName);
}

/**
 * Generate PDF for test results summary
 */
export async function generateTestResultsPDF(results: TestResultsData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let currentY = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Results Report', margin, currentY);
  currentY += 15;

  // Test Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Information', margin, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`Test Title: ${results.testTitle}`, margin, currentY);
  currentY += 8;
  pdf.text(`Type: ${results.testType?.toUpperCase()}`, margin, currentY);
  currentY += 8;
  if (results.subject) {
    pdf.text(`Subject: ${results.subject}`, margin, currentY);
    currentY += 8;
  }
  if (results.duration) {
    pdf.text(`Duration: ${results.duration} minutes`, margin, currentY);
    currentY += 8;
  }
  if (results.totalQuestions) {
    pdf.text(`Total Questions: ${results.totalQuestions}`, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Summary Statistics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary Statistics', margin, currentY);
  currentY += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`Total Attempts: ${results.totalAttempts}`, margin, currentY);
  currentY += 8;
  pdf.text(`Evaluated Attempts: ${results.evaluatedAttempts}`, margin, currentY);
  currentY += 8;
  pdf.text(`Average Score: ${Math.round(results.averageScore)}%`, margin, currentY);
  currentY += 8;
  pdf.text(`Pass Rate: ${Math.round(results.passRate)}%`, margin, currentY);
  currentY += 15;

  // Student Attempts Table
  if (results.attempts && results.attempts.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Attempts', margin, currentY);
    currentY += 10;

    // Table headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const colWidths = [60, 40, 30, 40]; // Student, Score, Time, Status
    const headers = ['Student', 'Score', 'Time', 'Status'];

    headers.forEach((header, index) => {
      let x = margin;
      for (let i = 0; i < index; i++) {
        x += colWidths[i];
      }
      pdf.text(header, x, currentY);
    });
    currentY += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    results.attempts.forEach((attempt: any) => {
      if (currentY > pdf.internal.pageSize.getHeight() - 40) {
        pdf.addPage();
        currentY = margin;
      }

      const studentName = attempt.studentName || attempt.studentEmail || 'Unknown';
      const score = attempt.totalScore && attempt.totalMarks
        ? `${attempt.totalScore}/${attempt.totalMarks}`
        : 'N/A';
      const timeSpent = attempt.timeSpent
        ? `${Math.floor(attempt.timeSpent / 60)}min`
        : 'N/A';
      const status = attempt.status === 'evaluated' ? 'Graded' : 'Submitted';

      const rowData = [studentName, score, timeSpent, status];

      rowData.forEach((data, index) => {
        let x = margin;
        for (let i = 0; i < index; i++) {
          x += colWidths[i];
        }
        const maxWidth = colWidths[index] - 5;
        const truncatedData = data.length > 15 ? data.substring(0, 12) + '...' : data;
        pdf.text(truncatedData, x, currentY);
      });

      currentY += 6;
    });
  }

  // Footer
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pdf.internal.pageSize.getHeight() - 10);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pdf.internal.pageSize.getHeight() - 10);
  }

  // Download the PDF
  const fileName = `${results.testTitle.replace(/[^a-z0-9]/gi, '_')}_results.pdf`;
  pdf.save(fileName);
}