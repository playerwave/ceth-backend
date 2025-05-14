"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCoop = void 0;
const typeorm_1 = require("typeorm");
const Department_1 = require("./Department");
const Grade_1 = require("./Grade");
let EventCoop = class EventCoop {
};
exports.EventCoop = EventCoop;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EventCoop.prototype, "eventcoop_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Department_1.Department, (department) => department.eventCoops),
    __metadata("design:type", Department_1.Department)
], EventCoop.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grade_1.Grade, (grade) => grade.eventCoops),
    __metadata("design:type", Grade_1.Grade)
], EventCoop.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EventCoop.prototype, "date", void 0);
exports.EventCoop = EventCoop = __decorate([
    (0, typeorm_1.Entity)()
], EventCoop);
