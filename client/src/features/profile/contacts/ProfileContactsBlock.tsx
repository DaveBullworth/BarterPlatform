import { Stack, Text } from '@mantine/core';
import {
  Mail,
  Phone,
  AtSign,
  Contact,
  User,
  Crown,
  CircleCheck,
  CircleX,
  MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isSelfUser, isAdminUser } from '@/entities/user';
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
  const isAdmin = role === USER_ROLES.ADMIN && isAdminUser(user);
  const isSelf = mode === 'self' && isSelfUser(user);
  const showPrivate = isAdmin || isSelf;

  return (
    <Stack gap="xs" className={styles.contactsBlock}>
      <InfoRow
        icon={<AtSign size={14} />}
        label={t('auth.login')}
        value={<Text size="sm">{user.login}</Text>}
      />

      <InfoRow
        icon={<Contact size={14} />}
        label={t('auth.name')}
        value={<Text size="sm">{user.name}</Text>}
      />

      {showPrivate && 'email' in user && (
        <InfoRow
          icon={<Mail size={14} />}
          label={t('auth.email')}
          value={<Text size="sm">{user.email}</Text>}
        />
      )}

      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.region')}
        value={user.region && <Text size="sm">{user.region.name}</Text>}
      />

      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.city')}
        value={user.city && <Text size="sm">{user.city.name}</Text>}
      />

      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.district')}
        value={user.district && <Text size="sm">{user.district.name}</Text>}
      />

      {showPrivate && 'phone' in user && (
        <InfoRow
          icon={<Phone size={14} />}
          label={t('auth.phone')}
          value={
            user.phone && (
              <Text size="sm">
                + ({BELARUS_PHONE_CODE}) {user.phone}
              </Text>
            )
          }
        />
      )}

      {isAdmin && (
        <>
          <InfoRow
            icon={
              user.status ? (
                <CircleCheck size={18} color="green" />
              ) : (
                <CircleX size={18} color="red" />
              )
            }
            label={t('common.status')}
            value={
              <Text size="sm">
                {user.status ? t('common.active') : t('common.noActive')}
              </Text>
            }
          />

          <InfoRow
            icon={
              user.statusEmail ? (
                <CircleCheck size={18} color="green" />
              ) : (
                <CircleX size={18} color="red" />
              )
            }
            label={t('common.statusEmail')}
            value={
              <Text size="sm">
                {user.statusEmail ? t('common.active') : t('common.noActive')}
              </Text>
            }
          />

          <InfoRow
            icon={
              user.role === USER_ROLES.ADMIN ? (
                <Crown size={18} color="gold" />
              ) : (
                <User size={18} color="blue" />
              )
            }
            label={t('common.role')}
            value={
              <Text size="sm">
                {user.role === USER_ROLES.ADMIN
                  ? t('common.admin')
                  : t('common.user')}
              </Text>
            }
          />
        </>
      )}
    </Stack>
  );
};
