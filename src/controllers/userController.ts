import { Request, Response } from 'express';
import { users, User } from '../models/user';

export const registerUser = (req: Request, res: Response) =>{
    const { username, email, password } = req.body;

    // TO DO: İleride burada 'bcrypt' kütüphanesi ile şifreleme yapacağız
    const newUser: User = {
    id: `user-${users.length + 101}`,
    username,
    email,
    passwordHash: `mock_hash_${password}`, 
    role: 'Member' // Varsayılan kayıt rolü
  };
  
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
};

// Kullanıcı Profili Getir (İleride Combined Resource buraya bağlanabilir)
export const getUserProfile = (req: Request, res: Response) => {
  const id = req.params.id;
  const user = users.find(u => u.id === id);

  if (!user) {
    res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
    return;
  }
  
  // Güvenlik: Kullanıcının parolasını JSON yanıtından çıkarıyoruz
  const { passwordHash, ...safeUserData } = user;
  
  res.status(200).json({ success: true, data: safeUserData });
};