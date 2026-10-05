export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: 'Guest' | 'Member' | 'Admin';
}

export interface UserRegistrationInput {
  username: string;
  email: string;
  password: string;
}

export let users: User[] = [
    {
    id: "user-101",
    username: "aleyna",
    email: "aleyna@example.com",
    passwordHash: "hashed_admin_password_123", // Replace with bcrypt hashing later.
    role: "Admin"
  }
]