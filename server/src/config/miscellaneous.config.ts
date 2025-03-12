export default function (env: NodeJS.ProcessEnv) {
  return {
    port: env.PORT,
    frontEndUrl: env.FRONTEND_URL || `http://localhost:5173`,
    groqApiKey: env.GROQ_API_KEY,
    redisUrl: env.UPSTASH_REDIS_REST_URL,
    redisToken: env.UPSTASH_REDIS_REST_TOKEN
  }
}
