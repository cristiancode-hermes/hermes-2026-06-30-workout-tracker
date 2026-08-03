/* Check workout tracker users - try DataSource */
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { DataSource } = require('typeorm');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Try various DI token patterns
  try {
    const ds = app.get(DataSource);
    const users = await ds.query('SELECT id, email, name FROM users');
    console.log(JSON.stringify(users));
  } catch(e) {
    console.log('DataSource failed:', e.message.substring(0, 80));
  }
  
  try {
    const ds2 = app.get('DataSource');
    const users2 = await ds2.query('SELECT id, email, name FROM users');
    console.log(JSON.stringify(users2));
  } catch(e) {
    console.log('DataSource string failed:', e.message.substring(0, 80));
  }
  
  await app.close();
  process.exit(0);
}
bootstrap().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
