import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, Alert } from '@mantine/core';

import { ProfileEditForm } from './ProfileEditForm';
import { buildAlertProps } from '@/shared/utils/alertPresets';
import type { AdminUserDto, SelfUserDto } from '@/types/user';

import styles from '../ProfilePage.module.scss';
import type { UserRole } from '@/shared/constants/user-role';
import ConfirmModal from '@/shared/ui/ConfirmModal';
import { getCities, getDistricts, getRegions } from '@/http/geography';
import type { CityOption, DistrictOption, RegionOption } from '@/types/geo.dto';

type Props = {
  opened: boolean;
  onClose: () => void;
  user: SelfUserDto | AdminUserDto;
  role?: UserRole;
  onUpdated: (user: SelfUserDto | AdminUserDto) => void;
};

export const ProfileEditModal = ({
  opened,
  onClose,
  user,
  role,
  onUpdated,
}: Props) => {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<React.ReactNode | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);

  const handleClose = () => {
    if (hasChanges) {
      setConfirmModalOpen(true);
      return;
    }
    setAlert(null);
    onClose();
  };

  useEffect(() => {
    getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (user?.region?.id) {
      getCities(Number(user.region.id)).then(setCities).catch(console.error);
    }

    if (user?.city?.id) {
      getDistricts(Number(user.city.id))
        .then(setDistricts)
        .catch(console.error);
    }
  }, [user?.region?.id, user?.city?.id]);

  const regionOptions = useMemo(
    () =>
      [...regions]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((region) => ({ value: String(region.id), label: region.name })),
    [regions],
  );

  const cityOptions = useMemo(
    () =>
      [...cities]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((city) => ({ value: String(city.id), label: city.name })),
    [cities],
  );

  const districtOptions = useMemo(
    () =>
      [...districts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((district) => ({
          value: String(district.id),
          label: district.name,
        })),
    [districts],
  );

  const handleRegionChange = (value: string | null) => {
    const regionId = value || '';

    setCities([]);
    setDistricts([]);

    if (regionId) {
      getCities(Number(regionId)).then(setCities).catch(console.error);
    }
  };

  const handleCityChange = (value: string | null) => {
    const cityId = value || '';

    setDistricts([]);

    if (cityId) {
      getDistricts(Number(cityId)).then(setDistricts).catch(console.error);
    }
  };

  return (
    <>
      <Modal
        mt="sm"
        opened={opened}
        onClose={handleClose}
        centered
        title={
          <Text fw={700} size="lg" td="underline">
            {t('profile.editData')}
          </Text>
        }
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        {alert && (
          <Alert
            mb="sm"
            className={styles.alert}
            onClose={() => setAlert(null)}
            {...buildAlertProps('error', alert)}
          />
        )}
        <div className={styles.modalEditForm}>
          <ProfileEditForm
            regionOptions={regionOptions}
            cityOptions={cityOptions}
            districtOptions={districtOptions}
            user={user}
            role={role}
            onUpdated={onUpdated}
            onClose={handleClose}
            onRegionChange={handleRegionChange}
            onCityChange={handleCityChange}
            onHasChangesChange={setHasChanges}
          />
        </div>
      </Modal>
      <ConfirmModal
        opened={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          setConfirmModalOpen(false);
          setAlert(null);
          onClose();
        }}
        title={t('profile.confirmTitle')}
        message={t('profile.confirmDiscardMessage')}
        confirmLabel={t('profile.confirmDiscardConfirm')}
        cancelLabel={t('profile.confirmDiscardCancel')}
      />
    </>
  );
};
