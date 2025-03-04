import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "unizalgroup@gmail.com",
    pass: "rwsg vgwh bzzj ryyr",
  },
});

export const sendMail = async (to: string, sub: string, msg: string) => {
  await transporter.sendMail({
    from: `"Unizal Group" <unizalgroup@gmail.com>`, // ✅ เพิ่ม from
    to: to,
    subject: sub,
    html: msg,
  });
};
