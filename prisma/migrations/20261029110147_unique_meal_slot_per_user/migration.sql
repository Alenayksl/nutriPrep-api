-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_userId_dayOfWeek_mealType_key" ON "MealPlan"("userId", "dayOfWeek", "mealType");

