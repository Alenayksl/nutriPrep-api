import { AppError } from "../errors/AppError";
import { mealPlans } from "../models/mealPlan";
import { recipes } from "../models/recipe";
import { User, users, UserRegistrationInput } from "../models/user";

type PublicUser = Omit<User, "passwordHash">;

const toPublicUser = ({ passwordHash: _passwordHash, ...user }: User): PublicUser => user;

export const registerUser = (input: UserRegistrationInput): PublicUser => {
  if (users.some((user) => user.email === input.email)) {
    throw new AppError(409, "This email address is already registered.");
  }

  const user: User = {
    id: `user-${users.length + 101}`,
    username: input.username,
    email: input.email,
    passwordHash: `mock_hash_${input.password}`,
    role: "Member"
  };
  users.push(user);
  return toPublicUser(user);
};

export const getUserDashboard = (userId: string) => {
  const user = users.find((item) => item.id === userId);
  if (!user) throw new AppError(404, "User not found.");

  const activeMealPlan = mealPlans.find((plan) => plan.userId === userId) ?? null;
  const totalMacroStatistics = { protein: 0, carbs: 0, fat: 0 };

  if (activeMealPlan) {
    recipes
      .filter((recipe) => activeMealPlan.recipeIds.includes(recipe.id))
      .forEach((recipe) => {
        totalMacroStatistics.protein += recipe.macros.protein;
        totalMacroStatistics.carbs += recipe.macros.carbs;
        totalMacroStatistics.fat += recipe.macros.fat;
      });
  }

  return {
    profile: toPublicUser(user),
    activeMealPlan,
    totalMacroStatistics
  };
};