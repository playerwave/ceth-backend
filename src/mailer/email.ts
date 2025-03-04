import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  secure: true,
  host: "stmp.gmail.com",
  port: 465,
  auth: {
    user: "unizalgroup@gmail.com",
    password: "unizal_4o1",
  },
});

function sendMail(to, sub, msg) {
    transporter.sendMail({
        to: to,
        subject: sub,
        html: msg
    })
}
