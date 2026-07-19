import "server-only";

import argon2 from "argon2";

const passwordHashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
}

export const argon2PasswordService: PasswordService = {
  hash(password) {
    return argon2.hash(password, passwordHashOptions);
  },
  verify(passwordHash, password) {
    return argon2.verify(passwordHash, password);
  },
};
