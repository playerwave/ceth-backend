export const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isProduction, // ใช้ HTTPS เฉพาะ production
    sameSite: (isProduction ? "lax" : "lax") as "lax" | "strict" | "none", // ✅ แก้ไข type
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    path: "/",
    domain: process.env.COOKIE_DOMAIN, // ถ้าต้องการตั้ง domain เฉพาะ
  };
};

export const getSessionConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    secret: process.env.SESSION_SECRET || "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      sameSite: (isProduction ? "lax" : "lax") as "lax" | "strict" | "none", // ✅ แก้ไข type
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    },
  };
};
