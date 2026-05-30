const WEAK_NUMERIC_SEQUENCES = new Set([
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "987654",
  "876543",
  "765432",
  "654321",
  "543210",
]);

function isRepeatedCharacter(password: string): boolean {
  return /^(.)(\1)+$/.test(password);
}

function isSequentialNumber(password: string): boolean {
  const onlyNumbers = /^\d+$/.test(password);
  if (!onlyNumbers || password.length < 6) return false;

  if (WEAK_NUMERIC_SEQUENCES.has(password)) return true;

  const digits = password.split("").map(Number);
  const direction = digits[1] - digits[0];
  if (direction !== 1 && direction !== -1) return false;

  return digits.every((digit, index) => index === 0 || digit - digits[index - 1] === direction);
}

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 6) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (isRepeatedCharacter(password)) {
    return "Use uma senha mais segura, sem repetir o mesmo caractere.";
  }

  if (isSequentialNumber(password)) {
    return "Use uma senha mais segura, sem sequencia numerica como 123456.";
  }

  return null;
}
