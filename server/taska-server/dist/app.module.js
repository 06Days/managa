"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const tasks_module_1 = require("./taska/tasks/tasks.module");
const typeorm_1 = require("@nestjs/typeorm");
const task_entity_1 = require("./taska/tasks/entities/task.entity");
const task_list_module_1 = require("./taska/task-list/task-list.module");
const task_list_entity_1 = require("./taska/task-list/entities/task-list.entity");
const app_manager_module_1 = require("./appmanager/app-manager.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
        imports: [task_list_module_1.TaskListModule,
            typeorm_1.TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: 'database.sqlite',
                entities: [task_entity_1.Task, task_list_entity_1.TaskList],
                synchronize: true,
            }),
            tasks_module_1.TasksModule,
            app_manager_module_1.AppManagerModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map