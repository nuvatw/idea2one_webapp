/**
 * Validation for participant login fields.
 * participant_code: exactly 3 digits, kept as string (preserve leading zeros).
 * email: trimmed and lowercased before comparison.
 */

export interface ParticipantLoginInput {
  participantCode: string;
  email: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    participantCode?: string;
    email?: string;
  };
}

export function validateParticipantLogin(input: ParticipantLoginInput): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  // participant_code: exactly 3 digits
  const code = input.participantCode.trim();
  if (!code) {
    errors.participantCode = "請輸入學員編號";
  } else if (!/^\d{3}$/.test(code)) {
    errors.participantCode = "學員編號為 3 碼數字";
  }

  // email: basic validation
  const email = input.email.trim();
  if (!email) {
    errors.email = "請輸入信箱";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "請輸入有效的信箱格式";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
