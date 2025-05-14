"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const Department_1 = require("../entity/Department");
const EventCoop_1 = require("../entity/EventCoop");
const Grade_1 = require("../entity/Grade");
dotenv_1.default.config();
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield (0, typeorm_1.createConnection)({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_HOST || '5432'),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            entities: [Department_1.Department, EventCoop_1.EventCoop, Grade_1.Grade],
            // logger: true,
            synchronize: true
        });
        console.log('Database connected successfully');
        return connection;
    }
    catch (error) {
        console.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล: ', error);
        throw new Error('การเชื่อมต่อฐานข้อมูลล้มเหลว');
    }
});
exports.connectDatabase = connectDatabase;
