import { Injectable } from '@nestjs/common';

import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { Dto } from './dto';

@Injectable()
export class AppService {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  sendToQueue(dto: Dto): Promise<string> {
    return this.rabbitmqService.sendTo(dto.queue, dto.connection);
  }
}
