type LimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

// Rate limiting disabled — will be re-enabled with Upstash Redis when needed
export async function checkGuestUploadLimit(_identifier: string): Promise<LimitResult> {
  return { success: true, remaining: 20, reset: 0 };
}
