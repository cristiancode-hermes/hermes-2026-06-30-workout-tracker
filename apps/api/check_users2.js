/* Check workout tracker users in DB */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { getEntityManager } = require('@nestjs/typeorm');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Try getting entity manager from a repository
  const seedService = app.get('SeedService');
  const em = seedService['userRepository'].manager;
  
  const users = await em.query('SELECT id, email, name, password FROM users');
  console.log(JSON.stringify(users));
  
  // Also check what passwords look like
  for (const u of users) {
    console.log(`User ${u.email}: password hash starts with ${u.password.substring(0, 20)}...`);
  }
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
