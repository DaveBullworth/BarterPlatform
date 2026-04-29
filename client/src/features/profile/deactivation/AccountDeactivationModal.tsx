import { useState } from 'react';
import { Modal, Button, Text, Group, Stack, PinInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDeactivation } from './useDeactivation';
import { notify } from '@/shared/lib';

type Props = {
  opened: boolean;
  onClose: () => void;
};

export const AccountDeactivationModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');

  const {
    codeRequested,
    requestCode,
    confirmDeactivation,
    isRequestingCode,
    isConfirming,
    reset,
  } = useDeactivation();

  const handleClose = () => {
    setCode('');
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (code.length !== 6) {
      notify({ message: t('deactivation.enterFullCode'), color: 'red' });
      return;
    }
    confirmDeactivation(code);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="lg" td="underline">
          {t('deactivation.title')}
        </Text>
      }
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack gap="md">
        <Text>{t('deactivation.text')}</Text>

        <PinInput
          length={6}
          value={code}
          onChange={setCode}
          placeholder="------"
          type="number"
          style={{ justifySelf: 'center' }}
        />

        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose}>
            {t('authRequired.cancel')}
          </Button>

          <Button
            disabled={codeRequested || isRequestingCode}
            loading={isRequestingCode}
            onClick={requestCode}
          >
            {t('deactivation.requestCode')}
          </Button>

          <Button color="red" loading={isConfirming} onClick={handleConfirm}>
            {t('deactivation.deactivate')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
