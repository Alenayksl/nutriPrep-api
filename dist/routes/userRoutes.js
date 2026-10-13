"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// User routes.
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authentication_1 = require("../middleware/authentication");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/register', validation_1.validateUserRegistration, userController_1.registerUser);
router.use(authentication_1.authenticateToken);
router.get('/:id/dashboard', userController_1.getCombinedUserProfile);
router.get('/:id', userController_1.getUserById);
router.put('/:id', validation_1.validateUserUpdate, userController_1.updateUser);
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
