import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PingService } from './ping.service';

@ApiTags('ping')
@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) { }

  @Get()
  @ApiOperation({
    summary: 'Ping',
    description:
      'Endpoint leve para verificar se o processo HTTP está respondendo.',
  })
  @ApiOkResponse({
    description: 'Texto fixo `pong`',
    schema: { type: 'string', example: 'pong' },
  })
  check() {
    return this.pingService.getPong();
  }
}