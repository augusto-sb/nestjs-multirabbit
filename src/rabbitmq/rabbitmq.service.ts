import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown,
} from '@nestjs/common';

import * as amqp from 'amqp-connection-manager';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import PublishOptions from 'amqplib';

type ConnStore = {
  name: string;
  channels?: { input: ChannelWrapper; output: ChannelWrapper };
  connection: AmqpConnectionManager;
};



const handledQueues: {name: string; func: Function}[] = [];
export const RabbiMQ: {
  (queue: string): MethodDecorator;
} = (queue: string): MethodDecorator => {
  //handledQueues.push(queue);
  return (
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    //descriptor.value()
    const originalMethod = descriptor.value;
    if (typeof originalMethod !== 'function') {
      throw new Error(`@RabbiMQ solo se puede aplicar a métodos.`);
    }
    if (originalMethod.length !== 1) {
      throw new Error(
        `El método "${key.toString()}" debe tener exactamente 1 parámetro. Actualmente tiene ${originalMethod.length}.`,
      );
    }
    handledQueues.push({name: queue, func: originalMethod})
  };
};

@Injectable()
export class RabbitmqService
  implements
    OnModuleInit,
    OnModuleDestroy,
    BeforeApplicationShutdown,
    OnApplicationShutdown
{
  private readonly connections: ConnStore[] = [];
  //private readonly handledQueues: string[] = ['q1', 'q2'];

  constructor() {
    for (const n of ['con1', 'con2']) {
      const conn: AmqpConnectionManager = amqp.connect(['amqp://localhost']);
      conn.on('connect', ({ connection, url }) => {
        console.log(
          'connect',
          connection.connection.serverProperties.version,
          url,
        );
      });
      conn.on('connectFailed', ({ err, url }) => {
        console.log('connectFailed', err, url);
        throw err;
      });
      conn.on('disconnect', ({ err }) => {
        console.log('disconnect', err);
      });
      conn.on('blocked', ({ reason }) => {
        console.log('blocked', reason);
      });
      conn.on('unblocked', () => {
        console.log('unblocked');
      });
      this.connections.push({
        name: n,
        //channel: chann,
        connection: conn,
      });
    }
  }

  async onModuleInit(): Promise<void> {
    //await connects
    for (const conn of this.connections) {
      const inputChann = await conn.connection.createChannel({
        setup: (channel) => {
          const promesas: Promise<any>[] = [];
          // `channel` here is a regular amqplib `ConfirmChannel`.
          // Note that `this` here is the channelWrapper instance.
          //solo aca anda assertQueue
          for (const q of handledQueues) {
          //for (const q of this.handledQueues) {
            promesas.push(channel.assertQueue(q.name, { durable: true }));
            promesas.push(channel.consume(q.name, (msg) => {
              if (msg !== null) {
                //console.log(msg.content.toString());
                q.func(msg.content.toString())
                channel.ack(msg);
              } else {
                console.log('Consumer cancelled by server');
              }
            })); // decorador
          }
          return Promise.all(promesas);
        },
      });
      inputChann.on('connect', () => {
        console.log('chann connect');
      });
      inputChann.on('error', (err, { name }) => {
        console.log('chann error', err, name);
        throw err;
      });
      inputChann.on('close', () => {
        console.log('chann close');
      });
      const outputChann = await conn.connection.createChannel();
      outputChann.on('connect', () => {
        console.log('chann connect');
      });
      outputChann.on('error', (err, { name }) => {
        console.log('chann error', err, name);
        throw err;
      });
      outputChann.on('close', () => {
        console.log('chann close');
      });
      conn.channels = { input: inputChann, output: outputChann };
    }
  }

  public /*async*/ onModuleDestroy(): /*Promise<*/ void /*>*/ {
    console.log(this.onModuleDestroy.name);
    /*await new Promise((res, rej) => {
      res();
    });*/
  }
  public beforeApplicationShutdown(): void {
    console.log(this.beforeApplicationShutdown.name);
  }
  public async onApplicationShutdown(): Promise<void> {
    console.log(this.onApplicationShutdown.name);
    //await AmqpConnectionManager#close()
    for (const c of this.connections) {
      await c.channels?.input.close();
      await c.channels?.output.close();
      await c.connection.close();
    }
  }

  public async sendTo(queue: string, connectionName: string): Promise<string> {
    const conn: ConnStore | undefined = this.connections.find(
      (x) => x.name === connectionName,
    );
    if (!conn) {
      throw new Error('connection not found');
    }
    await conn.channels?.output.assertQueue(queue, { durable: true });
    try {
      /*await conn.channels?.output.publish('amq.direct' o '', queue, 'message', {
        persistent: true,
      } as PublishOptions);*/ // JSON.stringify(message)
      await conn.channels?.output.sendToQueue(queue, JSON.stringify({message: 'mensaje'}), {
        persistent: true,
      } as PublishOptions);
    } catch (e) {
      console.log(e, 'possible exchange not exists');
    }
    return 'ok2';
  }
}
