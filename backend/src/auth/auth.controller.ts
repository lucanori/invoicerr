import { Body, Controller, Get, Post } from '@nestjs/common';

import { LoginRequired } from 'src/decorators/login-required.decorator';
import { User } from 'src/decorators/user.decorator';
import { CurrentUser } from 'src/types/user';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Get('me')
    @LoginRequired()
    getMe(@User() user: CurrentUser) {
    }

    @Post('signup')
    getSignup(@Body() body: SignupDto) {
        return this.authService.signUp(body.firstname, body.lastname, body.email, body.password);
    }

    @Post('login')
    getSignin(@Body() body: SignupDto) {
        return this.authService.signIn(body.email, body.password);
    }

    @Post('refresh')
    @LoginRequired()
    refreshTokens(@User() user: CurrentUser) {
        return this.authService.refreshToken(user.id, user.accessToken);
    }

}
