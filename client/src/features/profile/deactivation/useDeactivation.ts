import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { loggedOut, userApi } from '@/entities/user';
import {
  useNavigation,
  handleApiError,
  notify,
  createMutationErrorHandler,
} from '@/shared/lib';
import { DEACTIVATION_REQUEST } from '@/shared/constants/deactivation-request';

export const useDeactivation = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { toRoot } = useNavigation();
  const [codeRequested, setCodeRequested] = useState(false);

  const requestCode = useMutation({
    mutationFn: () => userApi.requestDeactivation(),
    onSuccess: (data) => {
      setCodeRequested(true);

      const messages: Record<string, string> = {
        [DEACTIVATION_REQUEST.SENT]: t('deactivation.codeSent'),
        [DEACTIVATION_REQUEST.ALREADY_REQESTED]: t(
          'deactivation.codeAlreadyRequested',
          { hours: data.waitHours?.toFixed(1) },
        ),
        [DEACTIVATION_REQUEST.ALREADY_DEACTIVATED]: t(
          'deactivation.alreadyDeactivated',
        ),
        [DEACTIVATION_REQUEST.USER_NOT_FOUND]: t('deactivation.userNotFound'),
      };

      notify({
        message: messages[data.result] ?? data.result,
        color: data.result === DEACTIVATION_REQUEST.SENT ? 'green' : 'yellow',
      });
    },
    onError: (error) => handleApiError(error, t),
  });

  const confirmDeactivation = useMutation({
    mutationFn: (code: string) => userApi.confirmDeactivation(code),
    onSuccess: () => {
      notify({ message: t('deactivation.success'), color: 'green' });
      dispatch(loggedOut());
      toRoot();
    },
    onError: createMutationErrorHandler(t, {
      badRequestTitle: t('deactivation.errorTitle'),
      badRequestMessage: t('deactivation.errorMessage'),
      defaultMessage: t('deactivation.failed'),
    }),
  });

  const reset = () => {
    setCodeRequested(false);
  };

  return {
    codeRequested,
    requestCode: () => requestCode.mutate(),
    confirmDeactivation: confirmDeactivation.mutate,
    isRequestingCode: requestCode.isPending,
    isConfirming: confirmDeactivation.isPending,
    reset,
  };
};
