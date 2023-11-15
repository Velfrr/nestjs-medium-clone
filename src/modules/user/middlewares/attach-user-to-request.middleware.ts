import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';

import { UserEntity } from '../user.entity';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class AttachUserToRequestMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
  ) {}

  async use(req: Request, _res: Response, next: (error?: any) => void) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    const userId = this.authService.decodeToken(token);

    if (userId === null) return next();

    const user = await this.userRepository.findOneBy({ id: Number(userId) });

    if (user) req.user = user;

    next();
  }
}
