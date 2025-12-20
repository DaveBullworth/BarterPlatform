import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity, UserRole, UserThemes } from '../entities/user.entity';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(UserEntity);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@barter.local';
  const adminLogin = process.env.ADMIN_LOGIN || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await userRepo.findOne({
    where: [{ email: adminEmail }, { login: adminLogin }],
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = userRepo.create({
    email: adminEmail,
    login: adminLogin,
    password: passwordHash,
    role: UserRole.ADMIN,
    status: true,
    theme: UserThemes.LIGHT,
  });

  await userRepo.save(admin);

  console.log('🚀 Admin user created');
}
