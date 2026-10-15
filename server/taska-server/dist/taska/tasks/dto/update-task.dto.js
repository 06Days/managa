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
exports.UpdateTaskDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_task_dto_1 = require("./create-task.dto");
const swagger_1 = require("@nestjs/swagger");
class UpdateTaskDto extends (0, mapped_types_1.PartialType)(create_task_dto_1.CreateTaskDto) {
    title;
    due_date;
    done;
    listPosition;
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The new task title' }),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The new due date' }),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "due_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'is task done' }),
    __metadata("design:type", Boolean)
], UpdateTaskDto.prototype, "done", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'where task is in list' }),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "listPosition", void 0);
//# sourceMappingURL=update-task.dto.js.map