import { Stack, Group, Text, Box, Badge, Divider, Image } from '@mantine/core';
import {
  Mail,
  Phone,
  Globe,
  AtSign,
  Contact,
  User,
  Crown,
  CircleCheck,
  CircleX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { USER_ROLES, type UserRole } from '@/shared/constants/user-role';
import { isSelfUser, isAdminUser } from './guard';
import type { Mode } from '../ProfilePage';
import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';

const STATIC_URL = import.meta.env.VITE_API_URL;

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
}) => {
  return (
    <Badge
      variant="light"
      radius="md"
      className={styles.contactBadge}
      fullWidth
    >
      <Group gap="sm" wrap="nowrap">
        {/* LABEL */}
        <Group gap={6} className={styles.contactLabel} wrap="nowrap">
          {icon}
          <Text size="sm" fw={500}>
            {label}
          </Text>
        </Group>

        <Divider orientation="vertical" />

        {/* VALUE */}
        <Box className={styles.contactValue}>
          {value ? (
            value
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              {t(`profile.missed`)}
            </Text>
          )}
        </Box>
      </Group>
    </Badge>
  );
};

export const ProfileContactsBlock = ({ user, role, mode }: Props) => {
  const { t } = useTranslation();

  return (
    <Stack gap="xs" className={styles.contactsBlock}>
      {/* LOGIN */}
      <InfoRow
        icon={<AtSign size={14} />}
        label={t(`auth.login`)}
        value={<Text size="sm">{user.login}</Text>}
        t={t}
      />

      {/* NAME */}
      <InfoRow
        icon={<Contact size={14} />}
        label={t(`auth.name`)}
        value={<Text size="sm">{user.name}</Text>}
        t={t}
      />

      {/* EMAIL */}
      {((role === USER_ROLES.ADMIN && isAdminUser(user)) ||
        (mode === 'self' && isSelfUser(user))) && (
        <InfoRow
          icon={<Mail size={14} />}
          label={t(`auth.email`)}
          value={<Text size="sm">{user.email}</Text>}
          t={t}
        />
      )}

      {/* COUNTRY */}
      <InfoRow
        icon={<Globe size={14} />}
        label={t(`auth.country`)}
        value={
          user.country && (
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" fw={500}>
                {t(`countries.${user.country.abbreviation}`)}
              </Text>

              {user.country.iconPath && (
                <Image
                  src={`${STATIC_URL}${user.country.iconPath}`}
                  width={20}
                  height={20}
                  alt={user.country.abbreviation}
                  radius="lg"
                  fit="contain"
                  className={styles.country_image}
                />
              )}
            </Group>
          )
        }
        t={t}
      />

      {/* PHONE */}
      {((role === USER_ROLES.ADMIN && isAdminUser(user)) ||
        (mode === 'self' && isSelfUser(user))) && (
        <InfoRow
          icon={<Phone size={14} />}
          label={t(`auth.phone`)}
          value={
            user.phone &&
            user.country && (
              <Text size="sm">
                + {'('}
                {user.country.phoneCode}
                {')'} {user.phone}
              </Text>
            )
          }
          t={t}
        />
      )}

      {/* ADMIN ONLY: STATUS, STATUS_EMAIL, ROLE */}
      {role === USER_ROLES.ADMIN && isAdminUser(user) && (
        <>
          {/* STATUS */}
          <InfoRow
            icon={
              user.status ? (
                <CircleCheck size={18} color="green" />
              ) : (
                <CircleX size={18} color="red" />
              )
            }
            label={t(`common.status`)}
            value={
              <Text size="sm">
                {user.status ? t(`common.active`) : t(`common.noActive`)}
              </Text>
            }
            t={t}
          />

          {/* STATUS EMAIL */}
          <InfoRow
            icon={
              user.statusEmail ? (
                <CircleCheck size={18} color="green" />
              ) : (
                <CircleX size={18} color="red" />
              )
            }
            label={t(`common.statusEmail`)}
            value={
              <Text size="sm">
                {user.statusEmail ? t(`common.active`) : t(`common.noActive`)}
              </Text>
            }
            t={t}
          />

          {/* ROLE */}
          <InfoRow
            icon={
              user.role === USER_ROLES.ADMIN ? (
                <Crown size={18} color="gold" />
              ) : (
                <User size={18} color="blue" />
              )
            }
            label={t(`common.role`)}
            value={
              <Text size="sm">
                {user.role === USER_ROLES.ADMIN
                  ? t(`common.admin`)
                  : t(`common.user`)}
              </Text>
            }
            t={t}
          />
        </>
      )}
    </Stack>
  );
};
