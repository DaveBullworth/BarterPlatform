import { Tooltip, Image, Text, Group, Center } from '@mantine/core';
import { User, Crown, CircleCheck, CircleX } from 'lucide-react';
import i18n from '@/shared/i18n';

import type { UserResponseDto } from '@/types/user';
import { USER_ROLES } from '@/shared/constants/user-role';

const STATIC_URL = import.meta.env.VITE_API_URL;

export type AdminCellContext<T> = {
  row: T;
  rowIndex: number;
  page: number;
  pageSize: number;
};

export type AdminColumn<T> = {
  id: string;
  header: string;
  width?: number;
  minWidth?: number;
  cell: (ctx: AdminCellContext<T>) => React.ReactNode;
  accessorFn?: (row: T) => string | number | null | undefined;
  headerAlign?: 'left' | 'center' | 'right'; // для <Th>
  cellAlign?: 'left' | 'center' | 'right'; // для <Td>
};

export const userColumns: AdminColumn<UserResponseDto>[] = [
  {
    id: 'index',
    header: '№',
    width: 80,
    headerAlign: 'center',
    cellAlign: 'center',
    cell: ({ rowIndex, page, pageSize }) =>
      (page - 1) * pageSize + rowIndex + 1,
  },

  {
    id: 'login',
    minWidth: 100,
    header: i18n.t(`auth.login`),
    cell: ({ row }) => row.login,
  },

  {
    id: 'email',
    minWidth: 100,
    header: i18n.t(`auth.email`),
    cell: ({ row }) => row.email,
  },

  {
    id: 'name',
    minWidth: 100,
    header: i18n.t(`auth.name`),
    cell: ({ row }) => row.name ?? '—',
  },

  {
    id: 'role',
    header: i18n.t(`common.role`),
    headerAlign: 'center',
    width: 80,
    cell: ({ row }) => {
      const isAdmin = row.role === USER_ROLES.ADMIN;

      return (
        <Center>
          <Tooltip
            label={isAdmin ? i18n.t(`common.admin`) : i18n.t(`common.user`)}
            withArrow
          >
            {isAdmin ? (
              <Crown size={18} color="gold" />
            ) : (
              <User size={18} color="blue" />
            )}
          </Tooltip>
        </Center>
      );
    },
  },

  {
    id: 'status',
    header: i18n.t(`common.status`),
    headerAlign: 'center',
    width: 80,
    cell: ({ row }) => (
      <Center>
        <Tooltip
          label={
            row.status ? i18n.t(`common.active`) : i18n.t(`common.noActive`)
          }
          withArrow
        >
          {row.status ? (
            <CircleCheck size={18} color="green" />
          ) : (
            <CircleX size={18} color="red" />
          )}
        </Tooltip>
      </Center>
    ),
  },

  {
    id: 'country',
    header: i18n.t(`auth.country`),
    headerAlign: 'center',
    width: 100,
    cell: ({ row }) => {
      const country = row.country;
      if (!country) return '—';

      const label = i18n.t(`countries.${country.abbreviation}`);

      return (
        <Center>
          <Group gap={8} wrap="nowrap">
            {country.iconPath && (
              <Tooltip label={label} withArrow>
                <Image
                  src={`${STATIC_URL}${country.iconPath}`}
                  w={25}
                  h={25}
                  radius="lg"
                  fit="contain"
                />
              </Tooltip>
            )}

            <Tooltip label={label} withArrow>
              <Text size="sm" c="dimmed">
                {country.abbreviation}
              </Text>
            </Tooltip>
          </Group>
        </Center>
      );
    },
  },

  {
    id: 'phone',
    header: i18n.t(`auth.phone`),
    minWidth: 120,
    accessorFn: (row) => row.phone ?? '',
    cell: ({ row }) => {
      if (!row.phone || !row.country) return '—';

      return (
        <Text size="sm">
          + ({row.country.phoneCode}) {row.phone}
        </Text>
      );
    },
  },

  {
    id: 'createdAt',
    header: i18n.t(`common.createdAt`),
    headerAlign: 'center',
    width: 120,
    cell: ({ row }) => {
      if (!row.createdAt) return '—';
      const date = new Date(row.createdAt);
      const formatted = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
      return (
        <Center>
          <Text size="sm">{formatted}</Text>
        </Center>
      );
    },
  },
];
