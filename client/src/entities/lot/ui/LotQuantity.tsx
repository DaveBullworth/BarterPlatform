import { Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  quantity: number;
  className?: string;
};

export const LotQuantity = ({ quantity, className }: Props) => {
  const { t } = useTranslation();

  return (
    <span className={className}>
      <Boxes size={14} strokeWidth={2.2} />
      <span>
        {t('lot.quantity')}: ×{quantity}
      </span>
    </span>
  );
};
