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
exports.AppManagerController = void 0;
const common_1 = require("@nestjs/common");
const app_manager_service_1 = require("./app-manager.service");
let AppManagerController = class AppManagerController {
    appDiscoveryService;
    constructor(appDiscoveryService) {
        this.appDiscoveryService = appDiscoveryService;
    }
    async getDiscoveredApps() {
        return this.appDiscoveryService.getApplications();
    }
};
exports.AppManagerController = AppManagerController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppManagerController.prototype, "getDiscoveredApps", null);
exports.AppManagerController = AppManagerController = __decorate([
    (0, common_1.Controller)('appmanager'),
    __metadata("design:paramtypes", [app_manager_service_1.AppManagerService])
], AppManagerController);
//# sourceMappingURL=app-manager.controller.js.map