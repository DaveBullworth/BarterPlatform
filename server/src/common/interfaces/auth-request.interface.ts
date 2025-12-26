import { AppRequest } from './app-request.interface';
import type { JwtPayload } from './jwt-payload.interface';

// расширяем основной интерфейс запроса для путей требующих авторизацтю
export interface AuthenticatedRequest extends AppRequest {
  user: JwtPayload; // теперь user обязательный
}
