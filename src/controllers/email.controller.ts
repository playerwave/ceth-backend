import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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
    
    // Render template ด้วยข้อมูลที่ส่งมา
    const renderedHtml = ejs.render(templateContent, data || {});
    
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

    // ส่งอีเมล
    await transporter.sendMail({
      from: `"ระบบจัดการกิจกรรม" <${process.env.EMAIL_SENDER}>`,
      to: data.recipientEmail,
      subject: `กิจกรรม: ${data.activityName || 'กิจกรรมใหม่'}`,
      html: renderedHtml,
    });
    
    // ส่งกลับผลลัพธ์
    res.json({
      success: true,
      message: "Email sent successfully",
      templateName,
      recipientEmail: data.recipientEmail
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
