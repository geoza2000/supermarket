import { admin } from '../admin';

export async function getAuthDisplayName(userId: string): Promise<string> {
  try {
    const rec = await admin.auth().getUser(userId);
    const name = rec.displayName?.trim();
    if (name) return name;
    const email = rec.email?.split('@')[0];
    if (email) return email;
    return 'Someone';
  } catch {
    return 'Someone';
  }
}
