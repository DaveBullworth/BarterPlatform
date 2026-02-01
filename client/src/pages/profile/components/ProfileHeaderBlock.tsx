import { useState } from 'react';
import { Box, Group, Stack, Text, Avatar } from '@mantine/core';
import { User } from 'lucide-react';

import { getUserAvatarUrl } from '@/http/media';
import { AvatarEditModal } from './AvatarEditModal';
import type { SelfUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';

type Props = {
  user: SelfUserDto;
};

export const ProfileHeaderBlock = ({ user }: Props) => {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(() => Date.now());
  return (
    <Group align="center" gap="lg">
      {/* AVATAR */}
      <Box w={120} h={120} className={styles.avatarBox}>
        <Avatar
          src={`${getUserAvatarUrl(user.id)}?v=${avatarKey}`}
          size={120}
          radius="md"
          onClick={() => setAvatarModalOpen(true)}
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
      <AvatarEditModal
        opened={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onUpdated={() => setAvatarKey(Date.now())}
      />
    </Group>
  );
};
