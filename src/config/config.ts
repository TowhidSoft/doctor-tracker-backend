import "dotenv/config";

export const PORT = process.env.PORT || 5000;
export const access_Key = process.env.JWT_ACCESS_SECRET_KEY;
export const refresh_Key = process.env.JWT_REFRESH_SECRET_KEY;

// URL of the deployed Next.js client; allowed by CORS.
export const frontend_url = process.env.FRONTEND_URL || "http://localhost:3000";
