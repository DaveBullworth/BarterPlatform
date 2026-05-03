import { Badge, Box, Card, Group, Stack, Text } from '@mantine/core';
import { Building2, Home, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type GeoNode = { id: number; name: string } | null;

type Props = {
  region: GeoNode;
  city: GeoNode;
  district: GeoNode;
};

export const LotLocation = ({ region, city, district }: Props) => {
  const { t } = useTranslation();

  return (
    <Card withBorder radius="md" p="md">
      <Badge mb={8} variant="light" color="blue">
        {t('lot.location')}
      </Badge>
      <Stack gap={10}>
        <Group gap={10}>
          <MapPin size={16} />
          <Text size="sm">
            <Box component="span" w="4rem" fw={700}>
              {t('lot.region')}:
            </Box>{' '}
            {region?.name ?? '—'}
          </Text>
        </Group>
        <Group gap={10}>
          <Building2 size={16} />
          <Text size="sm">
            <Box component="span" w="4rem" fw={700}>
              {t('lot.city')}:
            </Box>{' '}
            {city?.name ?? '—'}
          </Text>
        </Group>
        <Group gap={10}>
          <Home size={16} />
          <Text size="sm">
            <Box component="span" w="4rem" fw={700}>
              {t('lot.district')}:
            </Box>{' '}
            {district?.name ?? '—'}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};
