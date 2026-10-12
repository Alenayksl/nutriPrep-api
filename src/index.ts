// src/index.ts
import dotenv from "dotenv";
import app from "./server";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "5000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(port, () => {
  console.log(`NutriPrep API is running at http://localhost:${port}`);
});