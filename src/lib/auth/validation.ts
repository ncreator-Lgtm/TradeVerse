export type FieldErrors = {
  username?: string;
  displayName?: string;
  email?: string;
  password?: string;
};

export type AuthState = {
  error?: string;
  message?: string;
  fieldErrors?: FieldErrors;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function validateCredentials(email: string, password: string): FieldErrors {
  const fieldErrors: FieldErrors = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters.";
  }

  return fieldErrors;
}

export function validateRegistration(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}): FieldErrors {
  const fieldErrors = validateCredentials(input.email, input.password);

  if (!USERNAME_PATTERN.test(input.username)) {
    fieldErrors.username =
      "Username must be 3–20 characters: letters, numbers, or underscore.";
  }

  if (input.displayName.length < 2 || input.displayName.length > 40) {
    fieldErrors.displayName = "Display name must be 2–40 characters.";
  }

  return fieldErrors;
}

export function hasFieldErrors(fieldErrors: FieldErrors) {
  return Object.keys(fieldErrors).length > 0;
}
