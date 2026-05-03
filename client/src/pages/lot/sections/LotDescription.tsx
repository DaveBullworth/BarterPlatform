import { Badge, Card, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  description: string;
};

export const LotDescription = ({ description }: Props) => {
  const { t } = useTranslation();

  return (
    <Card withBorder>
      <Badge mb={8} variant="light" color="orange">
        {t('lot.description')}
      </Badge>
      <Text>{description}</Text>
    </Card>
  );
};
