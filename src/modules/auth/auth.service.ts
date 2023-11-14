import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import { User } from '../user/user.entity';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const [userWithGivenEmail, userWithGivenUsername] = await Promise.all([
      this.userRepository.findOneBy({
        email: registerDto.user.email,
      }),
      this.userRepository.findOneBy({ username: registerDto.user.username }),
    ]);

    if (userWithGivenEmail || userWithGivenUsername) {
      throw new HttpException(
        userWithGivenEmail
          ? 'User with given email already exists'
          : 'User with given username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await this.hashPassword(registerDto.user.password);

    const user = this.userRepository.create({
      email: registerDto.user.email,
      username: registerDto.user.username,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  buildAuthResponse(user: User) {
    const accessToken = jwt.sign(
      String(user.id),
      this.configService.get('JWT_SECRET'),
    );
    return {
      user: {
        email: user.email,
        username: user.username,
        bio: user.bio,
        image: user.image,
        token: accessToken,
      },
    };
  }
}