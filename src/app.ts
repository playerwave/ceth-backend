import express, { Request, Response } from "express";
import "reflect-metadata";
import cors from 'cors'
import session from "express-session";
import passport from "passport";
import usersRoute from "../src/routes/users.route";
import { UsersService } from "./services/users.service";
import dotenv from 'dotenv'
import flash from 'connect-flash';
import http, { IncomingMessage, ServerResponse } from 'http'
import helmet from 'helmet';
import departmentRoute from '../src/routes/department.route'
import facultyRoute from '../src/routes/faculty.route'


dotenv.config();
const app = express();
const port = 3001;
const usersService = new UsersService();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
usersService.initializePassport();
app.use(flash());

const secretKey = process.env.SECRET
if (!secretKey) {
  console.error('SECRET environment variable is not defined');
  process.exit(1);
}

app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(301, { Location: "https://" + req.headers.host + req.url });
  res.end();
}).listen(80, () => {
  console.log('HTTP server listening on port 80, redirecting to HTTPS');
})

app.use(helmet.frameguard({ action: "deny" }))

app.use("/", usersRoute);
app.use("/department", departmentRoute)
app.use("/faculty", facultyRoute)

app.listen(port, () => {
  console.log(`Server runing on port: http://localhost:${port}`);
});
