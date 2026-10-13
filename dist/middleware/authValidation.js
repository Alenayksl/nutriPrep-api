"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = void 0;
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const validateLogin = (req, res, next) => {
    const body = req.body;
    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
        res.status(400).json({ success: false, message: "Email and password are required." });
        return;
    }
    next();
};
exports.validateLogin = validateLogin;
