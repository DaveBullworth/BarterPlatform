import { UserEntity } from './user.entity';
import { MediaFileEntity } from './mediafile.entity';
import { EmailConfirmationEntity } from './email_confirmation.entity';
import { PasswordResetTokenEntity } from './password_reset_token.entity';
import { SessionEntity } from './session.entity';
import { AccountDeactivationCodeEntity } from './account_deactivation_code.entity';
import { LotEntity } from './lot.entity';
import { UserTaxonomyPreferenceEntity } from './user-taxonomy-preference.entity';
import { OfferEntity } from './offer.entity';
import { NotificationEntity } from './notification.entity';
import { ChatMessageEntity } from './chat-message.entity';
import { ChatAttachmentEntity } from './chat-attachment.entity';

export const entities = [
  UserEntity,
  SessionEntity,
  MediaFileEntity,
  EmailConfirmationEntity,
  PasswordResetTokenEntity,
  AccountDeactivationCodeEntity,
  LotEntity,
  UserTaxonomyPreferenceEntity,
  OfferEntity,
  NotificationEntity,
  ChatMessageEntity,
  ChatAttachmentEntity,
];
