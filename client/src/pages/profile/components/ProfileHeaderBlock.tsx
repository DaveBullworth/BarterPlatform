import { useState } from 'react';
import { Box, Group, Stack, Text, Avatar } from '@mantine/core';
import { User } from 'lucide-react';

import { getUserAvatarUrl } from '@/http/media';
import { AvatarEditModal } from './AvatarEditModal';
import {
  uploadAvatar,
  adminUploadAvatar,
  deleteAvatar,
  adminDeleteAvatar,
} from '@/http/media';
import type { SelfUserDto, AdminUserDto, PublicUserDto } from '@/types/user';
import type { Mode } from '../ProfilePage';

import styles from '../ProfilePage.module.scss';

type Props = {
  user: SelfUserDto | AdminUserDto | PublicUserDto;
  mode: Mode;
};

export const ProfileHeaderBlock = ({ user, mode }: Props) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(() => Date.now());

  // строго типизированные функции
  const uploadFn: (file: File) => Promise<{ message: string }> =
    mode === 'admin'
      ? (file) => adminUploadAvatar(user.id, file)
      : uploadAvatar;

  const deleteFn: () => Promise<{ message: string }> =
    mode === 'admin' ? () => adminDeleteAvatar(user.id) : deleteAvatar;

  return (
    <Group align="center" gap="lg">
      {/* AVATAR */}
      <Box w={120} h={120} className={styles.avatarBox}>
        <Avatar
          src={`${getUserAvatarUrl(user.id)}?v=${avatarKey}`}
          size={120}
          radius="md"
          onClick={
            ['self', 'admin'].includes(mode)
              ? () => setAvatarModalOpen(true)
              : undefined
          }
          style={{
            cursor: ['self', 'admin'].includes(mode) ? 'pointer' : 'default',
          }}
          color="gray"
        >
          <User size={48} />
        </Avatar>
      </Box>

      {/* TEXT INFO */}
      <Stack gap={4}>
        <Text fw={600} size="lg">
          {user.name}
        </Text>

        <Text size="sm" c="dimmed">
          @{user.login}
        </Text>
      </Stack>

      {['self', 'admin'].includes(mode) && (
        <AvatarEditModal
          opened={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          onUpdated={() => setAvatarKey(Date.now())}
          uploadFn={uploadFn}
          deleteFn={deleteFn}
        />
      )}
    </Group>
  );
};
