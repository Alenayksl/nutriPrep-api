"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authValidation_1 = require("../middleware/authValidation");
const router = (0, express_1.Router)();
router.post("/login", authValidation_1.validateLogin, authController_1.login);
exports.default = router;
