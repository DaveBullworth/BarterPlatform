import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal, Button, Text, Group, Stack } from '@mantine/core';
import { PinInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';

import { requestDeactivation, confirmDeactivation } from '@/http/deactivation';
import { logout } from '@/store/userSlice';
import { notify } from '@/shared/utils/notifications';
import { handleApiError } from '@/shared/utils/handleApiError';
import { DEACTIVATION_REQUEST } from '@/shared/constants/deactivation-request';
import type { ApiErrorData } from '@/types/error';
import { goToRoot } from '@/shared/utils/navigation';
import { useNavigate } from 'react-router-dom';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export const AccountDeactivationModal = ({ opened, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  const handleRequestCode = async () => {
    try {
      setLoadingRequest(true);
      const data = await requestDeactivation();

      if (data.result === DEACTIVATION_REQUEST.SENT) {
        notify({ message: t('deactivation.codeSent'), color: 'green' });
      } else if (data.result === DEACTIVATION_REQUEST.ALREADY_REQESTED) {
        notify({
          message: t('deactivation.codeAlreadyRequested', {
            hours: data.waitHours?.toFixed(1),
          }),
          color: 'yellow',
          autoClose: undefined,
        });
      } else if (data.result === DEACTIVATION_REQUEST.ALREADY_DEACTIVATED) {
        notify({
          message: t('deactivation.alreadyDeactivated'),
          color: 'blue',
        });
      } else if (data.result === DEACTIVATION_REQUEST.USER_NOT_FOUND) {
        notify({ message: t('deactivation.userNotFound'), color: 'red' });
      }

      setCodeRequested(true);
    } catch (e) {
      handleApiError(e, t);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) {
      notify({ message: t('deactivation.enterFullCode'), color: 'red' });
      return;
    }

    try {
      setLoadingConfirm(true);
      await confirmDeactivation({ code });
      notify({ message: t('deactivation.success'), color: 'green' });
      onClose();
      setCode('');
      setCodeRequested(false);
      dispatch(logout());
      goToRoot(navigate);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorData>;

      if (axiosError.response?.status) {
        const status = axiosError.response.status;

        // 400 — общий ответ безопасности
        if (status === 400) {
          notify({
            title: t('deactivation.errorTitle'),
            message: t('deactivation.errorMessage'),
            color: 'red',
          });
        } else {
          // остальные — технические
          handleApiError(err, t, {
            defaultMessage: t('deactivation.failed'),
          });
        }
      } else {
        handleApiError(err, t, { defaultMessage: t('deactivation.failed') });
      }
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleCancel = () => {
    setCode('');
    setCodeRequested(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={
        <Text fw={700} size="lg">
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
          <Button variant="default" onClick={handleCancel}>
            {t('authRequired.cancel')}
          </Button>

          <Button
            disabled={codeRequested || loadingRequest}
            loading={loadingRequest}
            onClick={handleRequestCode}
          >
            {t('deactivation.requestCode')}
          </Button>

          <Button color="red" loading={loadingConfirm} onClick={handleConfirm}>
            {t('deactivation.deactivate')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
