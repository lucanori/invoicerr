import * as bcrypt from 'bcrypt';
import * as os from 'os';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) { }


    static getJWTSecret() {
        const platform = os.platform();
        const arch = os.arch();
        const ram = os.totalmem();
        return bcrypt.hashSync(`${platform}-${arch}-${ram}`, 10);
    }

    async signUp(firstname: string, lastname: string, email: string, password?: string) {
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new Error('Email already used');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        const user = await this.prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 10),
            },
        });

        return user;
    }

    async signIn(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            throw new Error('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwt.sign(payload, {
            secret: AuthService.getJWTSecret(),
            expiresIn: '1h',
        });
        const refreshToken = this.jwt.sign(payload, {
            secret: AuthService.getJWTSecret(),
            expiresIn: '7d',
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
        };
    }

    async refreshToken(id: string, token: string) {
        try {
            const payload = this.jwt.verify(token, { secret: AuthService.getJWTSecret() });

            if (!payload || !payload.sub || !payload.email) {
                throw new Error('Invalid refresh token payload');
            }

            if (payload.sub !== id) {
                throw new Error('Token does not match user ID');
            }

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

            if (!user) {
                throw new Error('User not found');
            }

            const newAccessToken = this.jwt.sign({ sub: user.id, email: user.email }, {
                secret: AuthService.getJWTSecret(),
                expiresIn: '1h',
            });

            return { access_token: newAccessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
