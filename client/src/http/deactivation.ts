import { $authHost } from './index';
import type {
  DeactivationRequestResponseDto,
  DeactivationConfirmDto,
} from '@/types/deactivation.dto';

export const requestDeactivation = async () => {
  const { data } = await $authHost.post<DeactivationRequestResponseDto>(
    '/deactivation/request',
  );

  return data;
};

export const confirmDeactivation = async (dto: DeactivationConfirmDto) => {
  const { data } = await $authHost.post('/deactivation/confirm', dto);

  return data;
};
