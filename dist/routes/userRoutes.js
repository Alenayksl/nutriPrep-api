"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// User routes.
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/register', validation_1.validateUserRegistration, userController_1.registerUser);
// Return the combined user dashboard resource.
router.get('/:id/dashboard', userController_1.getCombinedUserProfile);
exports.default = router;
