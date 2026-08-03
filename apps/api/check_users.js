/* Check workout tracker users in DB */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const em = app.get('@nestjs/typeorm').getEntityManager();
  
  const users = await em.query('SELECT id, email, name FROM users');
  console.log(JSON.stringify(users));
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
