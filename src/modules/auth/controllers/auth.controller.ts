import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService, UserWithProfile } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dto/auth-credentials.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: AuthenticatedRequest): Promise<UserWithProfile> {
    return this.authService.getMe(req.user.id);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
