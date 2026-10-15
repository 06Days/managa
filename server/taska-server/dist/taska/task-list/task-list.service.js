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
exports.TaskListService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_list_entity_1 = require("./entities/task-list.entity");
const task_entity_1 = require("../tasks/entities/task.entity");
let TaskListService = class TaskListService {
    TaskListRepository;
    taskRepository;
    constructor(TaskListRepository, taskRepository) {
        this.TaskListRepository = TaskListRepository;
        this.taskRepository = taskRepository;
    }
    async createList(createTaskListDto) {
        const TaskList = this.TaskListRepository.create(createTaskListDto);
        return await this.TaskListRepository.save(TaskList);
    }
    async findAllLists() {
        return await this.TaskListRepository.find({
            relations: { tasks: true },
            order: {
                tasks: {
                    listPosition: 'ASC',
                },
            },
        });
    }
    async findOneList(id) {
        const TaskList = await this.TaskListRepository.findOne({
            where: { id },
            relations: { 'tasks': true },
        });
        if (!TaskList) {
            throw new common_1.NotFoundException(`Task list with ID ${id} not found`);
        }
        return TaskList;
    }
    async addTaskToList(listId, createTaskDto) {
        const TaskList = await this.findOneList(listId);
        const task = this.taskRepository.create({
            ...createTaskDto,
            TaskList,
        });
        return await this.taskRepository.save(task);
    }
    async removeList(id) {
        const result = await this.TaskListRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Task list with ID ${id} not found`);
        }
    }
    async updateList(id, updateTaskListDto) {
        const taskList = await this.TaskListRepository.findOne({ where: { id } });
        if (!taskList) {
            throw new common_1.NotFoundException(`Task list with ID ${id} not found`);
        }
        this.TaskListRepository.merge(taskList, updateTaskListDto);
        return await this.TaskListRepository.save(taskList);
    }
};
exports.TaskListService = TaskListService;
exports.TaskListService = TaskListService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_list_entity_1.TaskList)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TaskListService);
//# sourceMappingURL=task-list.service.js.map