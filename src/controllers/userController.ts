// User controllers.
import { Request, Response } from 'express';
import { UserRegistrationInput } from '../models/user';
import * as userService from '../services/userService';

export const registerUser = (req: Request<Record<string, never>, unknown, UserRegistrationInput>, res: Response) => {
    res.status(201).json({ success: true, data: userService.registerUser(req.body) });
};

// Return the combined user dashboard resource.
export const getCombinedUserProfile = (req: Request<{ id: string }>, res: Response) => {
    const dashboard = userService.getUserDashboard(req.params.id);
    res.status(200).json({
        success: true,
        data: dashboard
    });
};