import { Tooltip, Text, Center } from '@mantine/core';
import { User, Crown, CircleCheck, CircleX } from 'lucide-react';

import type { UserResponseDto } from '@/types/user';
import { USER_ROLES } from '@/shared/constants/user-role';
import { BELARUS_PHONE_CODE } from '@/shared/constants/country';
import type { TFunction } from 'i18next';

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
  resizable?: boolean;
  cell: (ctx: AdminCellContext<T>) => React.ReactNode;
  accessorFn?: (row: T) => string | number | null | undefined;
  headerAlign?: 'left' | 'center' | 'right'; // для <Th>
  cellAlign?: 'left' | 'center' | 'right'; // для <Td>
};

export const getUserColumns = (
  t: TFunction,
): AdminColumn<UserResponseDto>[] => [
  {
    id: 'index',
    header: '№',
    width: 50,
    resizable: false,
    headerAlign: 'center',
    cellAlign: 'center',
    cell: ({ rowIndex, page, pageSize }) =>
      (page - 1) * pageSize + rowIndex + 1,
  },

  {
    id: 'login',
    width: 200,
    minWidth: 100,
    header: t(`auth.login`),
    cell: ({ row }) => row.login,
  },

  {
    id: 'email',
    width: 200,
    minWidth: 100,
    header: t(`auth.email`),
    cell: ({ row }) => row.email,
  },

  {
    id: 'name',
    width: 200,
    minWidth: 100,
    header: t(`auth.name`),
    cell: ({ row }) => row.name ?? '—',
  },

  {
    id: 'role',
    header: t(`common.role`),
    headerAlign: 'center',
    width: 80,
    resizable: false,
    cell: ({ row }) => {
      const isAdmin = row.role === USER_ROLES.ADMIN;

      return (
        <Center>
          <Tooltip
            label={isAdmin ? t(`common.admin`) : t(`common.user`)}
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
    header: t(`common.status`),
    headerAlign: 'center',
    width: 80,
    resizable: false,
    cell: ({ row }) => (
      <Center>
        <Tooltip
          label={row.status ? t(`common.active`) : t(`common.noActive`)}
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
    id: 'region',
    header: t(`auth.region`),
    width: 160,
    cell: ({ row }) => row.region?.name ?? '—',
  },
  {
    id: 'city',
    header: t(`auth.city`),
    width: 160,
    cell: ({ row }) => row.city?.name ?? '—',
  },
  {
    id: 'district',
    header: t(`auth.district`),
    width: 160,
    cell: ({ row }) => row.district?.name ?? '—',
  },

  {
    id: 'phone',
    header: t(`auth.phone`),
    width: 140,
    resizable: false,
    accessorFn: (row) => row.phone ?? '',
    cell: ({ row }) => {
      if (!row.phone) return '—';

      return (
        <Text size="sm">
          + ({BELARUS_PHONE_CODE}) {row.phone}
        </Text>
      );
    },
  },

  {
    id: 'createdAt',
    header: t(`common.createdAt`),
    headerAlign: 'center',
    width: 120,
    resizable: false,
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
