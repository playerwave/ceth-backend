import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import dotenv from "dotenv";

dotenv.config();

// ✅ ตรวจสอบว่า EMAIL_SENDER และ EMAIL_APP_PASSWORD ถูกต้องหรือไม่
if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
  console.error("❌ Missing email credentials in .env file!");
}

// ✅ สร้าง transporter โดยใช้ข้อมูลจาก .env
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendMailCreateActivity = async (
  to: string,
  sub: string,
  msg: string
) => {
  try {
    // ✅ ใช้ __dirname เพื่อหาพาธของไฟล์ EJS อย่างถูกต้อง
    const templatePath = path.join(
      __dirname,
      "../mailer/template/createActivityTemplate.ejs"
    );

    // ✅ เช็คว่าไฟล์มีอยู่จริงก่อนอ่าน
    if (!fs.existsSync(templatePath)) {
      console.error("❌ EJS Template file not found at:", templatePath);
      return;
    }

    // ✅ อ่านไฟล์ EJS แล้วแปลงเป็น HTML
    const emailHtml = ejs.render(fs.readFileSync(templatePath, "utf-8"), {
      name: "John Doe",
      message: msg, // ✅ เพิ่ม message เข้าไป
    });

    // ✅ ส่งอีเมล
    await transporter.sendMail({
      from: `"Unizal Group" <${process.env.EMAIL_SENDER}>`, // ✅ ปลอดภัยขึ้น
      to: to,
      subject: sub,
      html: emailHtml, // ✅ ใช้ emailHtml ที่ render มาแล้ว
    });

    console.log("✅ Email sent successfully to", to);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};


export const sendMailUpdateActivity = async (
  to: string,
  sub: string,
  msg: string
) => {
  try {
    // ✅ ใช้ __dirname เพื่อหาพาธของไฟล์ EJS อย่างถูกต้อง
    const templatePath = path.join(
      __dirname,
      "../mailer/template/updateActivityTemplate.ejs"
    );

    // ✅ เช็คว่าไฟล์มีอยู่จริงก่อนอ่าน
    if (!fs.existsSync(templatePath)) {
      console.error("❌ EJS Template file not found at:", templatePath);
      return;
    }

    // ✅ อ่านไฟล์ EJS แล้วแปลงเป็น HTML
    const emailHtml = ejs.render(fs.readFileSync(templatePath, "utf-8"), {
      name: "John Doe",
      message: msg, // ✅ เพิ่ม message เข้าไป
    });

    // ✅ ส่งอีเมล
    await transporter.sendMail({
      from: `"Unizal Group" <${process.env.EMAIL_SENDER}>`, // ✅ ปลอดภัยขึ้น
      to: to,
      subject: sub,
      html: emailHtml, // ✅ ใช้ emailHtml ที่ render มาแล้ว
    });

    console.log("✅ Email sent successfully to", to);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

export const sendForgotPasswordCode = async (
  to: string,
  code: string
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../mailer/template/forgotPasswordTemplate.ejs"
    );

    if (!fs.existsSync(templatePath)) {
      console.error("❌ EJS Template file not found at:", templatePath);
      throw new Error("Email template not found");
    }

    const emailHtml = ejs.render(fs.readFileSync(templatePath, "utf-8"), {
      code: code
    });

    await transporter.sendMail({
      from: `"Burapha University" <${process.env.EMAIL_SENDER}>`,
      to: to,
      subject: "🔐 รหัสยืนยันลืมรหัสผ่าน - มหาวิทยาลัยบูรพา",
      html: emailHtml
    });

    console.log("✅ Forgot password code sent successfully to", to);
    return true;
  } catch (error) {
    console.error("❌ Error sending forgot password email:", error);
    throw error;
  }
};
