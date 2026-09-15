function booleanFromEnvironment(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true";
}

export function runtimeConfig(environment: NodeJS.ProcessEnv = process.env) {
  return {
    usgsLiveDataEnabled: booleanFromEnvironment(environment.USGS_LIVE_DATA_ENABLED),
    usgsApiKey: environment.USGS_API_KEY?.trim() || null,
    databaseUrl: environment.DATABASE_URL?.trim() || null,
  };
}
