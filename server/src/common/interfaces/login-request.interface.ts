import { Request } from 'express';

export interface RequestLogin extends Request {
  clientIp?: string;
  cookies: {
    device_id?: string;
    [key: string]: string | undefined;
  };
}
