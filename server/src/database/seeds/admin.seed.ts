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

  let country: CountryEntity | null = null;

  if (adminCountryAbbr) {
    country = await countryRepo.findOne({
      where: { abbreviation: adminCountryAbbr },
    });

    if (!country) {
      console.warn(
        `⚠️  Country with abbreviation "${adminCountryAbbr}" not found. Admin will be created without country.`,
      );
    }
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = userRepo.create({
    email: adminEmail,
    login: adminLogin,
    password: passwordHash,
    role: UserRole.ADMIN,
    status: true,
    theme: UserThemes.LIGHT,
    language: adminLanguage,
    ...(country ? { country } : {}),
  });

  await userRepo.save(admin);

  console.log('🚀 Admin user created');
}
