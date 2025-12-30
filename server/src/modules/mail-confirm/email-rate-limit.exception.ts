import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailConfirmationRateLimitException extends HttpException {
  constructor(waitHours: number) {
    super(
      {
        message: `You can request a new confirmation email in ${Math.ceil(
          waitHours,
        )} hour(s)`,
        waitHours,
      },
      HttpStatus.TOO_MANY_REQUESTS, // 429
    );
  }
}
