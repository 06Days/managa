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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const task_entity_1 = require("./entities/task.entity");
const typeorm_2 = require("@nestjs/typeorm");
let TasksService = class TasksService {
    taskRepository;
    constructor(taskRepository) {
        this.taskRepository = taskRepository;
    }
    async create(createTaskDto) {
        const task = this.taskRepository.create(createTaskDto);
        return await this.taskRepository.save(task);
    }
    async findAll() {
        return await this.taskRepository.find();
    }
    async remove(id) {
        const result = await this.taskRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
    }
    async toggle(id, listId) {
        const task = await this.taskRepository.findOne({ where: { id } });
        if (!task) {
            throw new common_1.NotFoundException(`Could not toggle task with ID ${id}`);
        }
        task.isCompleted = !task.isCompleted;
        console.log('h1');
        return await this.taskRepository.save(task);
    }
    async update(id, updateTaskDto) {
        const task = await this.taskRepository.findOne({ where: { id } });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        this.taskRepository.merge(task, updateTaskDto);
        return await this.taskRepository.save(task);
    }
    async swapTask(listId, task1id, task2id) {
        const task1 = await this.taskRepository.findOne({ where: { id: task1id, TaskList: { id: listId } } });
        const task2 = await this.taskRepository.findOne({ where: { id: task2id, TaskList: { id: listId } } });
        if (!task1 || !task2) {
            throw new common_1.NotFoundException(`One or another of the lists couldn't be found`);
        }
        const temp = task1.listPosition;
        task1.listPosition = task2.listPosition;
        task2.listPosition = temp;
        await this.taskRepository.save([task1, task2]);
    }
    async reorderTasks(listId, tasks) {
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i] && tasks[i].id) {
                await this.taskRepository.update({ id: tasks[i].id, TaskList: { id: listId } }, { listPosition: i });
            }
        }
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], TasksService);
//# sourceMappingURL=tasks.service.js.map