"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCombinedUserProfile = exports.deleteUser = exports.updateUser = exports.getUserById = exports.registerUser = void 0;
const userService_1 = require("../services/userService");
const registerUser = async (req, res) => {
    const user = await userService_1.userService.registerUser(req.body);
    res.status(201).json({ success: true, data: user });
};
exports.registerUser = registerUser;
const getUserById = async (req, res) => {
    res.status(200).json({ success: true, data: await userService_1.userService.getUser(req.params.id) });
};
exports.getUserById = getUserById;
const updateUser = async (req, res) => {
    const user = await userService_1.userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    await userService_1.userService.deleteUser(req.params.id);
    res.status(204).send();
};
exports.deleteUser = deleteUser;
const getCombinedUserProfile = async (req, res) => {
    const dashboard = await userService_1.userService.getUserDashboard(req.params.id);
    res.status(200).json({ success: true, data: dashboard });
};
exports.getCombinedUserProfile = getCombinedUserProfile;
