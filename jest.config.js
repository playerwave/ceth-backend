const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  verbose: true,
  testTimeout: 10000, // เพิ่ม timeout เป็น 10 วินาที
  forceExit: true, // บังคับให้ Jest exit หลัง test เสร็จ
  // ✅ เพิ่ม testPathIgnorePatterns เพื่อข้าม test ที่ไม่ต้องการ
  // testPathIgnorePatterns: ['<rootDir>/test/integration/'],
};