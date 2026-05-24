import { useState } from 'react';
import { Avatar, Badge } from '@mantine/core';
import { Camera, Crown, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [modalOpened, setModalOpened] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());

  const isEditable = mode === 'self' || mode === 'admin';
  const targetUserId = mode === 'admin' ? user.id : undefined;
  const uploadMutation = useUploadAvatar(targetUserId);
  const deleteMutation = useDeleteAvatar(targetUserId);

  const isAdmin = 'role' in user && user.role === USER_ROLES.ADMIN;
  const isActive = 'status' in user ? user.status : true;

  return (
    <div className={styles.hero}>
      <div className={styles.banner} />
      <div className={styles.bannerOverlay} />

      <div className={styles.body}>
        <div className={styles.avatarRow}>
          <div
            className={`${styles.avatarFrame} ${
              isEditable ? styles.editable : ''
            }`}
            onClick={isEditable ? () => setModalOpened(true) : undefined}
            role={isEditable ? 'button' : undefined}
            tabIndex={isEditable ? 0 : undefined}
            aria-label={isEditable ? t('profile.avatar') : undefined}
          >
            <Avatar
              src={getUserAvatarUrl(user.id, avatarVersion)}
              size={108}
              radius="md"
              color="barter"
            >
              <UserIcon size={44} />
            </Avatar>
            {isEditable && (
              <span className={styles.editHint}>
                <Camera size={22} strokeWidth={2} />
              </span>
            )}
          </div>

          <div className={styles.identity}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{user.name}</span>
            </div>
            <span className={styles.login}>@{user.login}</span>
            <div className={styles.metaRow}>
              {isAdmin && (
                <Badge
                  variant="light"
                  color="accent"
                  leftSection={<Crown size={12} strokeWidth={2.2} />}
                >
                  {t('common.admin')}
                </Badge>
              )}
              <Badge
                variant="light"
                color={isActive ? 'barter' : 'gray'}
              >
                {isActive ? t('common.active') : t('common.noActive')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

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
