import { useState } from 'react';
import { Box, Group, Stack, Text, Avatar } from '@mantine/core';
import { User } from 'lucide-react';

import { getUserAvatarUrl } from '@/entities/user';
import { useUploadAvatar, useDeleteAvatar } from '@/entities/user';
import { AvatarEditModal } from '@/features/profile/avatar';
import type { AnyUser, ProfileMode } from '@/entities/user';

import styles from './ProfileHeaderBlock.module.scss';

type Props = {
  user: AnyUser;
  mode: ProfileMode;
};

export const ProfileHeaderBlock = ({ user, mode }: Props) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());

  const isEditable = mode === 'self' || mode === 'admin';

  // Передаём userId в админ-режиме чтобы менять чужой аватар
  const targetUserId = mode === 'admin' ? user.id : undefined;
  const uploadMutation = useUploadAvatar(targetUserId);
  const deleteMutation = useDeleteAvatar(targetUserId);

  return (
    <Group align="center" gap="lg">
      <Box w={120} h={120} className={styles.avatarBox}>
        <Avatar
          src={getUserAvatarUrl(user.id, avatarVersion)}
          size={120}
          radius="md"
          onClick={isEditable ? () => setModalOpened(true) : undefined}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
          color="gray"
        >
          <User size={48} />
        </Avatar>
      </Box>

      <Stack gap={4}>
        <Text fw={600} size="lg">
          {user.name}
        </Text>
        <Text size="sm" c="dimmed">
          @{user.login}
        </Text>
      </Stack>

      {isEditable && (
        <AvatarEditModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onUpdated={() => setAvatarVersion(Date.now())}
          uploadFn={uploadMutation.mutateAsync}
          deleteFn={deleteMutation.mutateAsync}
        />
      )}
    </Group>
  );
};
