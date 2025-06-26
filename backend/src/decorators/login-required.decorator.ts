import { UseGuards, applyDecorators } from '@nestjs/common';

import { LoginRequiredGuard } from '../guards/login-required.guard';

export function LoginRequired() {
    return applyDecorators(
        UseGuards(LoginRequiredGuard)
    );
}
