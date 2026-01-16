import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  UserEntity,
  UserRole,
  UserThemes,
  UserLanguage,
} from '../entities/user.entity';
import { CountryEntity } from '../entities/country.entity';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(UserEntity);
  const countryRepo = dataSource.getRepository(CountryEntity);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@barter.local';
  const adminLogin = process.env.ADMIN_LOGIN || 'admin';
  const adminName = process.env.ADMIN_NAME || 'Radion';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminLanguage = UserLanguage.RU;
  const adminCountryAbbr = 'BLR';

  const existingAdmin = await userRepo.findOne({
    where: [{ email: adminEmail }, { login: adminLogin }],
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  const country = await countryRepo.findOne({
    where: { abbreviation: adminCountryAbbr },
  });

  if (!country) {
    throw new Error(
      `❌ Country with abbreviation "${adminCountryAbbr}" not found. ` +
        `Admin user cannot be created without country.`,
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await userRepo.upsert(
    {
      email: adminEmail,
      login: adminLogin,
      name: adminName,
      password: passwordHash,
      role: UserRole.ADMIN,
      status: true,
      statusEmail: true,
      theme: UserThemes.LIGHT,
      language: adminLanguage,
      country,
    },
    ['email'],
  );

  console.log('🚀 Admin user created');
}
