import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Get,
} from '@nestjs/common';

import { AppService } from './app.service';
import { Dto } from './dto';
import { RabbiMQ } from './rabbitmq/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  sendToQueue(@Body() dto: Dto): Promise<string> {
    if (
      typeof dto !== 'object' ||
      typeof dto.queue !== 'string' ||
      typeof dto.connection !== 'string'
    ) {
      throw new BadRequestException('bad dto');
    }
    return this.appService.sendToQueue(dto);
  }

  @Get()
  async testShutdown(): Promise<string> {
    //curl localhost:3000 y ctrl+c responds!
    await new Promise((r) => setTimeout(r, 5000));
    console.log('ok');
    /*
onModuleDestroy
beforeApplicationShutdown
Se presionó Ctrl+C. Realizando tareas de limpieza...
disconnect
disconnect
b678f7b47344f5bdc14745a04b454534d7a6d9f118524a45cd2553c2e21a7bd1
ok
onApplicationShutdown
*/
    return 'ok';
  }

  @RabbiMQ('myQueue')
  private testInput(message: string){
    console.log('testInput: '+message)
  }
}
