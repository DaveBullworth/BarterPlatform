import {
  Mail,
  Phone,
  AtSign,
  Contact,
  Crown,
  CircleCheck,
  CircleX,
  MapPin,
  Building2,
  Home,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isSelfUser } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';
import { InfoRow } from './InfoRow';
import type { AnyUser, ProfileMode } from '@/entities/user';
import type { UserRole } from '@/shared/constants/user-role';

import styles from './ProfileContactsBlock.module.scss';

type Props = {
  user: AnyUser;
  role?: UserRole;
  mode: ProfileMode;
};

export const ProfileContactsBlock = ({ user, role, mode }: Props) => {
  const { t } = useTranslation();
  const isAdmin = role === USER_ROLES.ADMIN;
  const isSelf = mode === 'self' && isSelfUser(user);
  const showPrivate = isAdmin || isSelf;

  return (
    <div className={styles.contactsBlock}>
      <InfoRow
        icon={<AtSign size={18} strokeWidth={2} />}
        label={t('auth.login')}
        value={user.login}
        accent="barter"
      />

      <InfoRow
        icon={<Contact size={18} strokeWidth={2} />}
        label={t('auth.name')}
        value={user.name}
        accent="barter"
      />

      {showPrivate && 'email' in user && (
        <InfoRow
          icon={<Mail size={18} strokeWidth={2} />}
          label={t('auth.email')}
          value={user.email}
        />
      )}

      {showPrivate && 'phone' in user && (
        <InfoRow
          icon={<Phone size={18} strokeWidth={2} />}
          label={t('auth.phone')}
          value={
            user.phone
              ? `+(${BELARUS_PHONE_CODE}) ${user.phone}`
              : undefined
          }
        />
      )}

      <InfoRow
        icon={<MapPin size={18} strokeWidth={2} />}
        label={t('auth.region')}
        value={user.region?.name}
      />

      <InfoRow
        icon={<Building2 size={18} strokeWidth={2} />}
        label={t('auth.city')}
        value={user.city?.name}
      />

      <InfoRow
        icon={<Home size={18} strokeWidth={2} />}
        label={t('auth.district')}
        value={user.district?.name}
      />

      {isAdmin && 'role' in user && (
        <InfoRow
          icon={
            user.role === USER_ROLES.ADMIN ? (
              <Crown size={18} strokeWidth={2} />
            ) : (
              <Contact size={18} strokeWidth={2} />
            )
          }
          label={t('common.role')}
          value={
            user.role === USER_ROLES.ADMIN
              ? t('common.admin')
              : t('common.user')
          }
          accent={user.role === USER_ROLES.ADMIN ? 'warning' : 'default'}
        />
      )}

      {isAdmin && 'status' in user && (
        <InfoRow
          icon={
            user.status ? (
              <CircleCheck size={18} strokeWidth={2} />
            ) : (
              <CircleX size={18} strokeWidth={2} />
            )
          }
          label={t('common.status')}
          value={user.status ? t('common.active') : t('common.noActive')}
          accent={user.status ? 'success' : 'danger'}
        />
      )}

      {isAdmin && 'statusEmail' in user && (
        <InfoRow
          icon={
            user.statusEmail ? (
              <CircleCheck size={18} strokeWidth={2} />
            ) : (
              <CircleX size={18} strokeWidth={2} />
            )
          }
          label={t('common.statusEmail')}
          value={
            user.statusEmail ? t('common.active') : t('common.noActive')
          }
          accent={user.statusEmail ? 'success' : 'danger'}
        />
      )}
    </div>
  );
};
