export function validateEnv() {
  const requiredEnvs = {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  };

  const missingEnvs = Object.entries(requiredEnvs)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingEnvs.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvs.join(", ")}`
    );
  }

  // Validate MongoDB URI format
  const mongoUri = process.env.MONGODB_URI as string;
  if (
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://")
  ) {
    console.error("Invalid MongoDB URI:", mongoUri.substring(0, 10) + "...");
    throw new Error(
      "Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://"
    );
  }

  return {
    mongodb: {
      uri: mongoUri,
    },
    nextauth: {
      secret: process.env.NEXTAUTH_SECRET as string,
      url: process.env.NEXTAUTH_URL as string,
    },
  };
}
