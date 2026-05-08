import { Card, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import styles from '../Lot.module.scss';

type Props = {
  quantity: number;
};

export const LotQuantity = ({ quantity }: Props) => {
  const { t } = useTranslation();

  return (
    <Card withBorder className={styles.quantity}>
      <Text fw={700}>{t('lot.quantity')}:</Text>
      <Text>{quantity}</Text>
    </Card>
  );
};
