/* Check workout tracker users in DB - use correct DI token */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { getRepositoryToken } = require('@nestjs/typeorm');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Try direct connection query
  const connection = app.get('default');
  if (connection && connection.query) {
    const users = await connection.query('SELECT id, email, name FROM users');
    console.log(JSON.stringify(users));
  }
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
