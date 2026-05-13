import { Injectable } from '@nestjs/common';

@Injectable()
export class PingService {
  getPong() {
    return 'pong';
  }
}