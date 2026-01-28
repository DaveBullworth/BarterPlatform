import { Box, Group, Stack, Text, Avatar } from '@mantine/core';
import { User } from 'lucide-react';

import type { SelfUserDto } from '@/types/user';
import { getUserAvatarUrl } from '@/http/media';

import styles from './ProfilePage.module.scss';

type Props = {
  user: SelfUserDto;
};

export const ProfileHeaderBlock = ({ user }: Props) => {
  return (
    <Group align="center" gap="lg">
      {/* AVATAR */}
      <Box w={120} h={120} className={styles.avatarBox}>
        <Avatar
          src={getUserAvatarUrl(user.id)}
          size={120}
          radius="md"
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
    </Group>
  );
};
