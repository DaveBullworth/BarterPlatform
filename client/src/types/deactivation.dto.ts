import type { DeactivationReqest } from '@/shared/constants/deactivation-request';

// DTO для ответа
export interface DeactivationRequestResponseDto {
  result: DeactivationReqest;
  waitHours?: number;
}

export interface DeactivationConfirmDto {
  code: string;
}
