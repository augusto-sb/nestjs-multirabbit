import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { version } from '../package.json';

async function bootstrap() {
  console.log(`app version: ${version}`);
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // recursos ?
  await app.listen(process.env.PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
