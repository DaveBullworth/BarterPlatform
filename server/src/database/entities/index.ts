import { UserEntity } from './user.entity';
import { CountryEntity } from './country.entity';
import { MediaFileEntity } from './mediafile.entity';
import { EmailConfirmationEntity } from './email_confirmation.entity';
import { PasswordResetTokenEntity } from './password_reset_token.entity';
import { SessionEntity } from './session.entity';

export const entities = [
  UserEntity,
  CountryEntity,
  SessionEntity,
  MediaFileEntity,
  EmailConfirmationEntity,
  PasswordResetTokenEntity,
];
