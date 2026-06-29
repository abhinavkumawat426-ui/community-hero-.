import { useState, useEffect } from "react";

export interface PasswordValidationResult {
  score: number; // 0 to 4
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMixedCase: boolean;
  feedback: string;
}

export function usePasswordValidation(password: string): PasswordValidationResult {
  const [result, setResult] = useState<PasswordValidationResult>({
    score: 0,
    hasMinLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMixedCase: false,
    feedback: "Too short",
  });

  useEffect(() => {
    if (!password) {
      setResult({
        score: 0,
        hasMinLength: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMixedCase: false,
        feedback: "Please enter a password",
      });
      return;
    }

    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecialChar) score += 1;
    if (hasMixedCase) score += 1;

    let feedback = "Weak";
    if (score === 4) {
      feedback = "Excellent / Extremely Strong";
    } else if (score === 3) {
      feedback = "Strong";
    } else if (score === 2) {
      feedback = "Fair / Moderate";
    } else if (score === 1) {
      feedback = "Weak";
    }

    setResult({
      score,
      hasMinLength,
      hasNumber,
      hasSpecialChar,
      hasMixedCase,
      feedback,
    });
  }, [password]);

  return result;
}
