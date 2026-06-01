export const EnvironmentType = {
  Sim: "sim",
  Seasonal: "seasonal",
  Official: "official",
  Private: "pserver"
} as const;

export type EnvironmentType = (typeof EnvironmentType)[keyof typeof EnvironmentType];

export function initializeEnvironment(): EnvironmentType {
  const name = Game.shard?.name?.toLowerCase();

  if (!name) {
    return EnvironmentType.Official; // Defaulting to official if shard name is missing
  }
  if (name === "sim") {
    // Note: Official MMO main shards are shard0, shard1, shard2, shard3
    return EnvironmentType.Sim;
  }
  if (name.includes("season")) {
    return EnvironmentType.Seasonal;
  }
  if (/^shard[0-3]$/.test(name)) {
    return EnvironmentType.Official;
  }

  return EnvironmentType.Private;
}
