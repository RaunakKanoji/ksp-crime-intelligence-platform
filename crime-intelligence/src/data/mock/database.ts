import "server-only";

import type { MockDatabaseState } from "@/data/contracts/entities";
import { AppError } from "@/server/catalyst/errors";
import { getMockConfig, type MockConfig } from "./config";
import { seedMockDatabase } from "./seed";

export type MockDatabaseStatus = {
  provider: "mock";
  seed: number;
  referenceDate: string;
  isSyntheticData: true;
  initializedAt: string;
  counts: Record<string, number>;
};

export class MockDatabase {
  private state: MockDatabaseState;
  private readonly config: MockConfig;
  private readonly initializedAt: string;

  constructor(config = getMockConfig()) {
    if (!config.enabled) throw new AppError("DATABASE_UNAVAILABLE", "The mock database is disabled by MOCK_DATABASE_ENABLED.");
    this.config = config;
    this.initializedAt = config.referenceDate;
    this.state = seedMockDatabase(config);
  }

  get data(): MockDatabaseState {
    return this.state;
  }

  reset(): MockDatabaseStatus {
    this.state = seedMockDatabase(this.config);
    return this.status();
  }

  status(): MockDatabaseStatus {
    const counts = Object.fromEntries(Object.entries(this.state).map(([key, value]) => [key, value.length]));
    return {
      provider: "mock",
      seed: this.config.seed,
      referenceDate: this.config.referenceDate,
      isSyntheticData: true,
      initializedAt: this.initializedAt,
      counts,
    };
  }
}

type GlobalWithMockDatabase = typeof globalThis & { __kspMockDatabase?: MockDatabase };

export function getMockDatabase(): MockDatabase {
  const globalState = globalThis as GlobalWithMockDatabase;
  if (!globalState.__kspMockDatabase) globalState.__kspMockDatabase = new MockDatabase();
  return globalState.__kspMockDatabase;
}

export function resetMockDatabase(): MockDatabaseStatus {
  return getMockDatabase().reset();
}
