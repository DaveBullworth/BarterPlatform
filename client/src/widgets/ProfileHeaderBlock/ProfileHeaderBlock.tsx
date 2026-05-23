import { useState } from 'react';
import { Stack, Text, Avatar, Badge } from '@mantine/core';
import { User } from 'lucide-react';

import {
  getUserAvatarUrl,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/entities/user';
import { AvatarEditModal } from '@/features/profile/avatar';
import type { AnyUser, ProfileMode } from '@/entities/user';
import { USER_ROLES } from '@/shared/constants/user-role';

import styles from './ProfileHeaderBlock.module.scss';

type Props = {
  user: AnyUser;
  mode: ProfileMode;
};

export const ProfileHeaderBlock = ({ user, mode }: Props) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());

  const isEditable = mode === 'self' || mode === 'admin';

  const targetUserId = mode === 'admin' ? user.id : undefined;
  const uploadMutation = useUploadAvatar(targetUserId);
  const deleteMutation = useDeleteAvatar(targetUserId);

  const isAdmin = 'role' in user && user.role === USER_ROLES.ADMIN;

  return (
    <div className={styles.profileHeader}>
      <div
        className={`${styles.avatarBox} ${isEditable ? styles.editable : ''}`}
        onClick={isEditable ? () => setModalOpened(true) : undefined}
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable ? 0 : undefined}
      >
        <Avatar
          src={getUserAvatarUrl(user.id, avatarVersion)}
          size={108}
          radius="md"
          color="barter"
        >
          <User size={44} />
        </Avatar>
      </div>

      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text fw={700} size="xl" lineClamp={1}>
          {user.name}
        </Text>
        <Text size="sm" c="dimmed">
          @{user.login}
        </Text>
        {isAdmin && (
          <Badge mt={4} variant="light" color="accent" size="sm" w="fit-content">
            Admin
          </Badge>
        )}
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
    </div>
  );
};
