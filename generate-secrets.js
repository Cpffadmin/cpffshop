const crypto = require("crypto");

const nextAuthSecret = crypto.randomBytes(32).toString("base64");
const jwtSecret = crypto.randomBytes(32).toString("base64");

console.log("Generated Secrets:");
console.log("NEXTAUTH_SECRET=" + nextAuthSecret);
console.log("JWT_SECRET=" + jwtSecret);
