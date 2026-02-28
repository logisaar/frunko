import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password, dto.fullName);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.email, dto.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = req.user as { user: any; token: string };
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8081',
    );
    res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async getSession(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getSession(user.id);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut() {
    return { message: 'Signed out successfully' };
  }
}
