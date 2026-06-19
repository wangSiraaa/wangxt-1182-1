import { sequelize, testConnection } from './connection';
import { setupAssociations } from '../models';

export const runMigrations = async () => {
  try {
    await testConnection();
    setupAssociations();

    await sequelize.sync({ alter: true, logging: true });

    console.log('✓ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}
