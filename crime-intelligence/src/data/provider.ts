import "server-only";

import { AppError } from "@/server/catalyst/errors";
import type { RepositoryProvider } from "@/data/contracts/repositories";
import { getDataProvider } from "@/data/mock/config";
import { createMockRepositoryProvider } from "@/data/mock/repositories";

let provider: RepositoryProvider | null = null;

export function createRepositoryProvider(): RepositoryProvider {
  if (provider) return provider;
  const selected = getDataProvider();
  if (selected === "mock") {
    provider = createMockRepositoryProvider();
    return provider;
  }
  throw new AppError("DATABASE_UNAVAILABLE", "The Neon provider is not implemented in this development build.");
}

export function resetRepositoryProvider(): void {
  provider = null;
}

export function getRepositoryProvider(): RepositoryProvider {
  return createRepositoryProvider();
}
