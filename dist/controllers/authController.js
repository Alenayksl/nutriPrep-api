"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const authService_1 = require("../services/authService");
const login = async (req, res) => {
    const result = await authService_1.authService.login(req.body);
    res.status(200).json({ success: true, data: result });
};
exports.login = login;
