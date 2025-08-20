import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { StudentsDao } from "../daos/Student/student.dao";

dotenv.config();

export const previewEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateName, data } = req.body;
    
    // ตรวจสอบ template name
    if (!templateName) {
      res.status(400).json({
        success: false,
        message: "Template name is required"
      });
      return;
    }

    // ค้นหา template ในทุกโฟลเดอร์
    const baseTemplatesDir = path.join(__dirname, "../mailer/template");
    let templatePath = null;
    
    // อ่านโฟลเดอร์ทั้งหมดใน template
    const subdirs = fs.readdirSync(baseTemplatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // เพิ่มโฟลเดอร์ root ด้วย
    subdirs.push('');
    
    // ค้นหา template ในทุกโฟลเดอร์
    for (const subdir of subdirs) {
      const testPath = path.join(baseTemplatesDir, subdir, `${templateName}.ejs`);
      if (fs.existsSync(testPath)) {
        templatePath = testPath;
        break;
      }
    }
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!templatePath) {
      res.status(404).json({
        success: false,
        message: `Template ${templateName} not found in any directory`
      });
      return;
    }

    // อ่านไฟล์ template
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    
    // Render template ด้วยข้อมูลที่ส่งมา
    const renderedHtml = ejs.render(templateContent, data || {});
    
    // ส่งกลับ HTML ที่ render แล้ว
    res.json({
      success: true,
      html: renderedHtml,
      templateName,
      data,
      templatePath: templatePath.replace(__dirname, '') // แสดง path ที่พบ
    });

  } catch (error) {
    console.error("Error previewing email template:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const listAvailableTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const baseTemplatesDir = path.join(__dirname, "../mailer/template");
    const allTemplates: string[] = [];
    
    // อ่านโฟลเดอร์ทั้งหมดใน template
    const subdirs = fs.readdirSync(baseTemplatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // เพิ่มโฟลเดอร์ root ด้วย
    subdirs.push('');
    
    // อ่านไฟล์ .ejs จากทุกโฟลเดอร์
    for (const subdir of subdirs) {
      const templatesDir = path.join(baseTemplatesDir, subdir);
      try {
        const files = fs.readdirSync(templatesDir);
        const ejsTemplates = files
          .filter(file => file.endsWith('.ejs'))
          .map(file => file.replace('.ejs', ''));
        
        allTemplates.push(...ejsTemplates);
      } catch (error) {
        console.warn(`Cannot read directory: ${templatesDir}`);
      }
    }
    
    res.json({
      success: true,
      templates: allTemplates,
      count: allTemplates.length
    });

  } catch (error) {
    console.error("Error listing templates:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const sendEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateName, data } = req.body;

    console.log("sendEmailTemplate" );
    console.log("Template Name:", templateName);
    
    // ตรวจสอบ template name
    if (!templateName) {
      res.status(400).json({
        success: false,
        message: "Template name is required"
      });
      return;
    }

    // ตรวจสอบอีเมลผู้รับ
    if (!data.recipientEmail) {
      res.status(400).json({
        success: false,
        message: "Recipient email is required"
      });
      return;
    }

    // ค้นหา template ในทุกโฟลเดอร์
    const baseTemplatesDir = path.join(__dirname, "../mailer/template");
    let templatePath = null;
    
    // อ่านโฟลเดอร์ทั้งหมดใน template
    const subdirs = fs.readdirSync(baseTemplatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // เพิ่มโฟลเดอร์ root ด้วย
    subdirs.push('');
    
    // ค้นหา template ในทุกโฟลเดอร์
    for (const subdir of subdirs) {
      let testPath;
      if (subdir === '') {
        // ค้นหาในโฟลเดอร์ root
        testPath = path.join(baseTemplatesDir, `${templateName}.ejs`);
      } else {
        // ค้นหาในโฟลเดอร์ย่อย
        testPath = path.join(baseTemplatesDir, subdir, `${templateName}.ejs`);
      }
      
      if (fs.existsSync(testPath)) {
        templatePath = testPath;
        console.log("Found template at:", templatePath);
        break;
      }
    }
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!templatePath) {
      res.status(404).json({
        success: false,
        message: `Template ${templateName} not found in any directory`
      });
      return;
    }

    // อ่านไฟล์ template
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    console.log("Template content length:", templateContent.length);
    
    // Render template ด้วยข้อมูลที่ส่งมา
    const renderedHtml = ejs.render(templateContent, data || {});
    console.log("Rendered HTML length:", renderedHtml.length);
    console.log("Template data:", JSON.stringify(data, null, 2));
    
    // ตรวจสอบ environment variables
    if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("Missing email configuration:", {
        EMAIL_SENDER: process.env.EMAIL_SENDER ? "SET" : "MISSING",
        EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? "SET" : "MISSING"
      });
      res.status(500).json({
        success: false,
        message: "Email configuration is missing"
      });
      return;
    }

    console.log("Email configuration:", {
      sender: process.env.EMAIL_SENDER,
      recipient: data.recipientEmail,
      subject: `กิจกรรม: ${data.activityName || 'กิจกรรมใหม่'}`
    });

    // สร้าง transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // ตรวจสอบการเชื่อมต่อ
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      res.status(500).json({
        success: false,
        message: "SMTP connection failed",
        error: verifyError instanceof Error ? verifyError.message : "Unknown error"
      });
      return;
    }

    // ส่งอีเมล
    const mailResult = await transporter.sendMail({
      from: `"ระบบจัดการกิจกรรม" <${process.env.EMAIL_SENDER}>`,
      to: data.recipientEmail,
      subject: `กิจกรรม: ${data.activityName || 'กิจกรรมใหม่'}`,
      html: renderedHtml,
    });
    
    console.log("Email sent successfully:", {
      messageId: mailResult.messageId,
      recipient: data.recipientEmail,
      templateName
    });
    
    // ส่งกลับผลลัพธ์
    res.json({
      success: true,
      message: "Email sent successfully",
      templateName,
      recipientEmail: data.recipientEmail,
      messageId: mailResult.messageId
    });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// ฟังก์ชันส่งอีเมลแจ้งเตือนเมื่อ Course เริ่มต้น
export const sendCourseStartEmail = async (activityData: any): Promise<void> => {
  try {
    // ตรวจสอบ environment variables
    console.log("🔍 [sendCourseStartEmail] Checking environment variables...");
    console.log("🔍 [sendCourseStartEmail] EMAIL_SENDER:", process.env.EMAIL_SENDER ? "SET" : "MISSING");
    console.log("🔍 [sendCourseStartEmail] EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "SET" : "MISSING");
    
    if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("❌ Missing email configuration for course start notification");
      console.error("❌ EMAIL_SENDER:", process.env.EMAIL_SENDER);
      console.error("❌ EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD);
      return;
    }

    // ตรวจสอบว่า activity ยังเป็น Start Activity อยู่หรือไม่ (ป้องกันการส่งซ้ำ)
    if (!activityData.activity_id) {
      console.log(`⚠️ Activity ID not provided, skipping email send`);
      return;
    }

    console.log(`📧 Preparing to send course start email for activity: ${activityData.activity_id} - ${activityData.activity_name}`);

    // สร้าง transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // เตรียมข้อมูลสำหรับ template
    const emailData = {
      recipientEmail: "tanapatwave14@gmail.com",
      activityName: activityData.activity_name,
      activityLink: activityData.url || "https://example.com", // ใช้ลิงก์จากฐานข้อมูล หรือ default
      contactEmail: "kamonwans@go.buu.ac.th", // ใช้ค่า default เพราะไม่มี contact_email ในฐานข้อมูล
      activityImage: activityData.image_url,
      organizerName: activityData.presenter_company_name || "คณะวิทยาการสารสนเทศ",
      activityType: activityData.type || "Hard Skill",
      hoursEarned: activityData.recieve_hours || "6",
      description: activityData.description || "คอร์สได้เริ่มต้นแล้ว กรุณาเข้าร่วมตามเวลาที่กำหนด"
    };

    // 🔍 Log ข้อมูลกิจกรรมก่อนส่งอีเมล
    console.log("📧 [sendCourseStartEmail] Activity data before sending email:");
    console.log("📧 [sendCourseStartEmail] Raw activityData:", JSON.stringify(activityData, null, 2));
    console.log("📧 [sendCourseStartEmail] Processed emailData:", JSON.stringify(emailData, null, 2));

    // อ่าน template
    const templatePath = path.join(__dirname, "../mailer/template/activity/NewCourseTemplate.ejs");
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const renderedHtml = ejs.render(templateContent, emailData);

    // ส่งอีเมล
    console.log("📧 [sendCourseStartEmail] Attempting to send email...");
    console.log("📧 [sendCourseStartEmail] From:", process.env.EMAIL_SENDER);
    console.log("📧 [sendCourseStartEmail] To:", emailData.recipientEmail);
    console.log("📧 [sendCourseStartEmail] Subject:", `🎓 คอร์สเริ่มต้นแล้ว: ${activityData.activity_name}`);
    
    const mailResult = await transporter.sendMail({
      from: `"ระบบจัดการกิจกรรม" <${process.env.EMAIL_SENDER}>`,
      to: emailData.recipientEmail,
      subject: `🎓 คอร์สเริ่มต้นแล้ว: ${activityData.activity_name}`,
      html: renderedHtml,
    });

    console.log(`✅ Course start email sent successfully for activity: ${activityData.activity_name}`);
    console.log(`✅ Message ID: ${mailResult.messageId}`);
  } catch (error) {
    console.error("❌ Error sending course start email:", error);
  }
};

// ฟังก์ชันส่งอีเมลแจ้งเตือนเมื่อกิจกรรมเปิดรับสมัคร
export const sendOpenRegisterEmail = async (activityData: any): Promise<void> => {
  try {
    // ตรวจสอบ environment variables
    console.log("🔍 [sendOpenRegisterEmail] Checking environment variables...");
    console.log("🔍 [sendOpenRegisterEmail] EMAIL_SENDER:", process.env.EMAIL_SENDER ? "SET" : "MISSING");
    console.log("🔍 [sendOpenRegisterEmail] EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "SET" : "MISSING");
    
    if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("❌ Missing email configuration for open register notification");
      console.error("❌ EMAIL_SENDER:", process.env.EMAIL_SENDER);
      console.error("❌ EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD);
      return;
    }

    // ตรวจสอบว่า activity มีข้อมูลครบหรือไม่
    if (!activityData.activity_id) {
      console.log(`⚠️ Activity ID not provided, skipping email send`);
      return;
    }

    console.log(`📧 Preparing to send open register email for activity: ${activityData.activity_id} - ${activityData.activity_name}`);

    // สร้าง transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // เตรียมข้อมูลสำหรับ template
    const emailData = {
      recipientEmail: "tanapatwave14@gmail.com",
      activityName: activityData.activity_name,
      message: `กิจกรรม ${activityData.activity_name} ได้เปิดรับสมัครแล้ว กรุณาตรวจสอบรายละเอียดด้านล่าง`,
      activityDate: activityData.start_activity_date ? new Date(activityData.start_activity_date).toLocaleDateString('th-TH') : "ไม่ระบุ",
      activityTime: activityData.start_activity_date && activityData.end_activity_date ? 
        `${new Date(activityData.start_activity_date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - ${new Date(activityData.end_activity_date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}` : "ไม่ระบุ",
      building: "อาคารคณะวิทยาการสารสนเทศ", // ค่า default
      floor: "3", // ค่า default
      room: "301", // ค่า default
      maxParticipants: activityData.seat?.toString() || "50",
      registrationLink: activityData.url || "https://example.com/register",
      deadline: activityData.end_register_date ? new Date(activityData.end_register_date).toLocaleDateString('th-TH') : "ไม่ระบุ",
      contactEmail: "kamonwans@go.buu.ac.th",
      activityImage: activityData.image_url,
      activityDateISO: activityData.start_activity_date ? new Date(activityData.start_activity_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : "20241220T090000Z",
      activityEndDateISO: activityData.end_activity_date ? new Date(activityData.end_activity_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : "20241220T160000Z",
      organizerName: activityData.presenter_company_name || "คณะวิทยาการสารสนเทศ",
      activityType: activityData.type === "Hard" ? "Hard Skill" : "Soft Skill",
      hoursEarned: activityData.recieve_hours?.toString() || "3"
    };

    // 🔍 Debug: ตรวจสอบข้อมูลที่ส่งไปยัง template
    console.log("🔍 [sendOpenRegisterEmail] Email data for template:", {
      activityName: emailData.activityName,
      activityDate: emailData.activityDate,
      activityTime: emailData.activityTime,
      maxParticipants: emailData.maxParticipants,
      registrationLink: emailData.registrationLink,
      deadline: emailData.deadline,
      activityDateISO: emailData.activityDateISO,
      activityEndDateISO: emailData.activityEndDateISO
    });

    // 🔍 Log ข้อมูลกิจกรรมก่อนส่งอีเมล
    console.log("📧 [sendOpenRegisterEmail] Activity data before sending email:");
    console.log("📧 [sendOpenRegisterEmail] Raw activityData:", JSON.stringify(activityData, null, 2));
    console.log("📧 [sendOpenRegisterEmail] Processed emailData:", JSON.stringify(emailData, null, 2));

    // อ่าน template
    const templatePath = path.join(__dirname, "../mailer/template/activity/OpenRegisterTemplate.ejs");
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const renderedHtml = ejs.render(templateContent, emailData);

    // ส่งอีเมล
    console.log("📧 [sendOpenRegisterEmail] Attempting to send email...");
    console.log("📧 [sendOpenRegisterEmail] From:", process.env.EMAIL_SENDER);
    console.log("📧 [sendOpenRegisterEmail] To:", emailData.recipientEmail);
    console.log("📧 [sendOpenRegisterEmail] Subject:", `🎉 กิจกรรมเปิดรับสมัคร: ${activityData.activity_name}`);
    
    const mailResult = await transporter.sendMail({
      from: `"ระบบจัดการกิจกรรม" <${process.env.EMAIL_SENDER}>`,
      to: emailData.recipientEmail,
      subject: `🎉 กิจกรรมเปิดรับสมัคร: ${activityData.activity_name}`,
      html: renderedHtml,
    });

    console.log(`✅ Open register email sent successfully for activity: ${activityData.activity_name}`);
    console.log(`✅ Message ID: ${mailResult.messageId}`);
  } catch (error) {
    console.error("❌ Error sending open register email:", error);
  }
};

// ฟังก์ชันส่งอีเมลไปหานิสิตตาม risk_status
export const sendEmailToStudentsByRiskStatus = async (activityData: any, riskStatus: string, templateName: string): Promise<void> => {
  try {
    // ตรวจสอบ environment variables
    console.log("🔍 [sendEmailToStudentsByRiskStatus] Checking environment variables...");
    console.log("🔍 [sendEmailToStudentsByRiskStatus] EMAIL_SENDER:", process.env.EMAIL_SENDER ? "SET" : "MISSING");
    console.log("🔍 [sendEmailToStudentsByRiskStatus] EMAIL_APP_PASSWORD:", process.env.EMAIL_APP_PASSWORD ? "SET" : "MISSING");
    
    if (!process.env.EMAIL_SENDER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("❌ Missing email configuration for student notification");
      return;
    }

    // ตรวจสอบว่า activity มีข้อมูลครบหรือไม่
    if (!activityData.activity_id) {
      console.log(`⚠️ Activity ID not provided, skipping email send`);
      return;
    }

        console.log(`📧 Preparing to send ${templateName} email to students with risk_status: ${riskStatus}`);

    // ดึงรายชื่อนิสิตตาม risk_status โดยใช้ query โดยตรง
    const { DataSource } = require("typeorm");
    const { connectDatabase } = require("../db/database");
    
    let dataSource: any = null;
    let students: any[] = [];
    
    try {
      dataSource = await connectDatabase();
      console.log("✅ Database connection established for student query");
      
      const sql = `
        SELECT 
          s.students_id,
          s.users_id,
          s.first_name,
          s.last_name,
          s.email,
          s.soft_hours,
          s.hard_hours,
          s.risk_status,
          s.education_status,
          s.faculty_id,
          s.department_id,
          s.grade_id,
          s.eventcoop_id,
          f.faculty_name,
          d.department_name,
          g.level as grade_level,
          ec.date as event_coop_date
        FROM students s
        LEFT JOIN faculty f ON s.faculty_id = f.faculty_id
        LEFT JOIN department d ON s.department_id = d.department_id
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        LEFT JOIN event_coop ec ON s.eventcoop_id = ec.eventcoop_id
        WHERE s.risk_status = $1
        ORDER BY s.students_id ASC
      `;
      
      students = await dataSource.query(sql, [riskStatus]);
      console.log(`📧 Found ${students.length} students with risk_status: ${riskStatus}`);
      
      // 🔍 Debug: ตรวจสอบข้อมูลนิสิตที่ดึงมาได้
      console.log(`🔍 [sendEmailToStudentsByRiskStatus] Students data:`, students.map(s => ({
        id: s.students_id,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        risk_status: s.risk_status
      })));
      
      if (students.length === 0) {
        console.log(`📧 No students found with risk_status: ${riskStatus}`);
        return;
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError);
      return;
    }

    // สร้าง transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // เตรียมข้อมูลสำหรับ template
    const emailData = {
      activityName: activityData.activity_name,
      message: `กิจกรรม ${activityData.activity_name} ได้เปิดรับสมัครแล้ว กรุณาตรวจสอบรายละเอียดด้านล่าง`,
      activityDate: activityData.start_activity_date ? new Date(activityData.start_activity_date).toLocaleDateString('th-TH') : "ไม่ระบุ",
      activityTime: activityData.start_activity_date && activityData.end_activity_date ? 
        `${new Date(activityData.start_activity_date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} - ${new Date(activityData.end_activity_date).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}` : "ไม่ระบุ",
      building: "อาคารคณะวิทยาการสารสนเทศ", // ค่า default
      floor: "3", // ค่า default
      room: "301", // ค่า default
      maxParticipants: activityData.seat?.toString() || "50",
      registrationLink: activityData.url || "https://example.com/register",
      deadline: activityData.end_register_date ? new Date(activityData.end_register_date).toLocaleDateString('th-TH') : "ไม่ระบุ",
      contactEmail: "kamonwans@go.buu.ac.th",
      activityImage: activityData.image_url,
      activityDateISO: activityData.start_activity_date ? new Date(activityData.start_activity_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : "20241220T090000Z",
      activityEndDateISO: activityData.end_activity_date ? new Date(activityData.end_activity_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : "20241220T160000Z",
      organizerName: activityData.presenter_company_name || "คณะวิทยาการสารสนเทศ",
      activityType: activityData.type === "Hard" ? "Hard Skill" : "Soft Skill",
      hoursEarned: activityData.recieve_hours?.toString() || "3"
    };

    // อ่าน template
    const templatePath = path.join(__dirname, `../mailer/template/activity/${templateName}.ejs`);
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // ส่งอีเมลไปหานิสิตทุกคน
    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        const renderedHtml = ejs.render(templateContent, emailData);
        
        const mailResult = await transporter.sendMail({
          from: `"ระบบจัดการกิจกรรม" <${process.env.EMAIL_SENDER}>`,
          to: student.email,
          subject: `🎉 กิจกรรมเปิดรับสมัคร: ${activityData.activity_name}`,
          html: renderedHtml,
        });

        console.log(`✅ Email sent to ${student.email} (${student.first_name} ${student.last_name})`);
        console.log(`✅ Message ID: ${mailResult.messageId}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send email to ${student.email}:`, error);
        errorCount++;
      }
    }

    console.log(`📧 Email sending completed for ${templateName}:`);
    console.log(`✅ Success: ${successCount} emails`);
    console.log(`❌ Failed: ${errorCount} emails`);
    console.log(`📊 Total students with risk_status ${riskStatus}: ${students.length}`);

  } catch (error) {
    console.error("❌ Error sending emails to students:", error);
  }
};
