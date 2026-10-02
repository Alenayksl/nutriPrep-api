// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recipeRoutes from './routes/recipeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import mealPlanRoutes from './routes/mealPlanRoutes';

// .env dosyasındaki ayarları okumayı aktif ediyoruz
dotenv.config();

// Express uygulamamızı oluşturuyoruz
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware'ler (Ara katmanlar)
// cors: Farklı domainlerden (örneğin React uygulaman) gelen isteklere izin verir
app.use(cors());
// express.json(): Gelen isteklerin gövdesindeki (body) veriyi JSON olarak okumamızı sağlar
app.use(express.json());

// --- ROUTE BAĞLANTILARI ---
// /api/recipes adresine gelen tüm istekleri recipeRoutes garsonuna gönder
app.use('/api/recipes' , recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/mealplans', mealPlanRoutes);

// Temel bir Test Route'u (Lab 1'de hocaya gösterebileceğimiz ilk çalışan uç nokta)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: "NutriPrep API çalışıyor!",
    version: "1.0.0"
  });
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
  console.log(` Sunucu http://localhost:${PORT} adresinde başarıyla çalışıyor!`);
});