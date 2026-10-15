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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListController = void 0;
const common_1 = require("@nestjs/common");
const task_list_service_1 = require("./task-list.service");
const update_task_list_dto_1 = require("./dto/update-task-list.dto");
const create_task_list_dto_1 = require("./dto/create-task-list.dto");
const create_task_dto_1 = require("../tasks/dto/create-task.dto");
let TaskListController = class TaskListController {
    taskListsService;
    constructor(taskListsService) {
        this.taskListsService = taskListsService;
    }
    createList(createTaskListDto) {
        return this.taskListsService.createList(createTaskListDto);
    }
    findAllLists() {
        return this.taskListsService.findAllLists();
    }
    findOneList(id) {
        return this.taskListsService.findOneList(id);
    }
    updateList(id, updateTaskListDto) {
        return this.taskListsService.updateList(id, updateTaskListDto);
    }
    addTaskToList(id, createTaskDto) {
        return this.taskListsService.addTaskToList(id, createTaskDto);
    }
    removeList(id) {
        return this.taskListsService.removeList(id);
    }
};
exports.TaskListController = TaskListController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_list_dto_1.CreateTaskListDto]),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "createList", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "findAllLists", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "findOneList", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_task_list_dto_1.UpdateTaskListDto]),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "updateList", null);
__decorate([
    (0, common_1.Post)(':id/tasks'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "addTaskToList", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TaskListController.prototype, "removeList", null);
exports.TaskListController = TaskListController = __decorate([
    (0, common_1.Controller)('task-lists'),
    __metadata("design:paramtypes", [task_list_service_1.TaskListService])
], TaskListController);
//# sourceMappingURL=task-list.controller.js.map