import { Building2, Home, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type GeoNode = { id: number; name: string } | null;

type Props = {
  region: GeoNode;
  city: GeoNode;
  district: GeoNode;
  /** Возвращает классы из page module — компонент остаётся презентационным. */
  classes?: {
    section?: string;
    sectionTitle?: string;
    sectionTitleAccent?: string;
    list?: string;
    row?: string;
    icon?: string;
    label?: string;
    value?: string;
    valueMuted?: string;
  };
};

/**
 * Презентация локации лота. Изначально жила в карточке с Badge,
 * теперь принимает classes извне — стиль решает страница.
 */
export const LotLocation = ({ region, city, district, classes = {} }: Props) => {
  const { t } = useTranslation();

  const rows: { icon: typeof MapPin; label: string; value: string | null }[] = [
    { icon: MapPin, label: t('lot.region'), value: region?.name ?? null },
    { icon: Building2, label: t('lot.city'), value: city?.name ?? null },
    { icon: Home, label: t('lot.district'), value: district?.name ?? null },
  ];

  return (
    <div className={classes.section}>
      <div className={classes.sectionTitle}>
        <span className={classes.sectionTitleAccent} />
        <span>{t('lot.location')}</span>
      </div>
      <div className={classes.list}>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} className={classes.row}>
              <span className={classes.icon}>
                <Icon size={14} strokeWidth={2} />
              </span>
              <div>
                <span className={classes.label}>{row.label}</span>
                <span
                  className={`${classes.value} ${
                    !row.value ? classes.valueMuted ?? '' : ''
                  }`}
                >
                  {row.value ?? '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
