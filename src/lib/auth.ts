import { cookies } from 'next/headers';

export async function getTeacherEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const teacherToken = cookieStore.get('teacher_token');
    
    if (!teacherToken) {
      return null;
    }

    // Decode the token (it's base64 encoded JSON)
    const decoded = JSON.parse(Buffer.from(teacherToken.value, 'base64').toString());
    return decoded.email || null;
  } catch (error) {
    console.error('Failed to get teacher email from token:', error);
    return null;
  }
}

export async function getTeacherData() {
  try {
    const cookieStore = await cookies();
    const teacherToken = cookieStore.get('teacher_token');
    
    if (!teacherToken) {
      return null;
    }

    // Decode the token (it's base64 encoded JSON)
    const decoded = JSON.parse(Buffer.from(teacherToken.value, 'base64').toString());
    return decoded;
  } catch (error) {
    console.error('Failed to decode teacher token:', error);
    return null;
  }
}
