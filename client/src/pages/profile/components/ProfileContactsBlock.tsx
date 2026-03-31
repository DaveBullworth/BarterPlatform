import { Stack, Group, Text, Box, Badge, Divider } from '@mantine/core';
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
import type { TFunction } from 'i18next';

import { USER_ROLES, type UserRole } from '@/shared/constants/user-role';
import { isSelfUser, isAdminUser } from './guard';
import type { Mode } from '../ProfilePage';
import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';
import styles from '../ProfilePage.module.scss';

type Props = {
  user: SelfUserDto | AdminUserDto | PublicUserDto;
  role?: UserRole;
  mode: Mode;
};

const InfoRow = ({
  icon,
  label,
  value,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  t: TFunction;
}) => (
  <Badge variant="light" radius="md" className={styles.contactBadge} fullWidth>
    <Group gap="sm" wrap="nowrap">
      <Group gap={6} className={styles.contactLabel} wrap="nowrap">
        {icon}
        <Text size="sm" fw={500}>
          {label}
        </Text>
      </Group>
      <Divider orientation="vertical" />
      <Box className={styles.contactValue}>
        {value ? (
          value
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            {t('profile.missed')}
          </Text>
        )}
      </Box>
    </Group>
  </Badge>
);

export const ProfileContactsBlock = ({ user, role, mode }: Props) => {
  const { t } = useTranslation();

  return (
    <Stack gap="xs" className={styles.contactsBlock}>
      <InfoRow
        icon={<AtSign size={14} />}
        label={t('auth.login')}
        value={<Text size="sm">{user.login}</Text>}
        t={t}
      />
      <InfoRow
        icon={<Contact size={14} />}
        label={t('auth.name')}
        value={<Text size="sm">{user.name}</Text>}
        t={t}
      />

      {((role === USER_ROLES.ADMIN && isAdminUser(user)) ||
        (mode === 'self' && isSelfUser(user))) && (
        <InfoRow
          icon={<Mail size={14} />}
          label={t('auth.email')}
          value={<Text size="sm">{user.email}</Text>}
          t={t}
        />
      )}

      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.region')}
        value={user.region && <Text size="sm">{user.region.name}</Text>}
        t={t}
      />
      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.city')}
        value={user.city && <Text size="sm">{user.city.name}</Text>}
        t={t}
      />
      <InfoRow
        icon={<MapPin size={14} />}
        label={t('auth.district')}
        value={user.district && <Text size="sm">{user.district.name}</Text>}
        t={t}
      />

      {((role === USER_ROLES.ADMIN && isAdminUser(user)) ||
        (mode === 'self' && isSelfUser(user))) && (
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
          t={t}
        />
      )}

      {role === USER_ROLES.ADMIN && isAdminUser(user) && (
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
            t={t}
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
            t={t}
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
            t={t}
          />
        </>
      )}
    </Stack>
  );
};
