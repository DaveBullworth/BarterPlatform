import { Stack, Group, Text, Box, Badge, Divider, Image } from '@mantine/core';
import { Mail, Phone, Globe, AtSign, Contact } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';

const STATIC_URL = import.meta.env.VITE_API_URL;

type Props = {
  user: SelfUserDto | AdminUserDto | PublicUserDto;
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

export const ProfileContactsBlock = ({ user }: Props) => {
  const { t } = useTranslation();

  function hasPrivateContacts(
    user: SelfUserDto | AdminUserDto | PublicUserDto,
  ): user is SelfUserDto | AdminUserDto {
    return 'email' in user;
  }

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
      {hasPrivateContacts(user) && (
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
      {hasPrivateContacts(user) && (
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
    </Stack>
  );
};
