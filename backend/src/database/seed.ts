import { sequelize } from './connection';
import { setupAssociations, User } from '../models';
import { UserRole } from '../types/enums';

export const seedDatabase = async () => {
  try {
    setupAssociations();
    await sequelize.authenticate();

    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('Database already seeded. Skipping...');
      process.exit(0);
    }

    const users = await User.bulkCreate([
      {
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        orgName: '系统管理部',
      },
      {
        username: 'research1',
        password: 'research123',
        name: '张三',
        email: 'zhangsan@research.com',
        phone: '13800138001',
        role: UserRole.RESEARCH_CENTER,
        orgName: '北京协和医院研究中心',
      },
      {
        username: 'research2',
        password: 'research123',
        name: '李四',
        email: 'lisi@research.com',
        phone: '13800138002',
        role: UserRole.RESEARCH_CENTER,
        orgName: '上海瑞金医院研究中心',
      },
      {
        username: 'customs1',
        password: 'customs123',
        name: '王五',
        email: 'wangwu@customs.com',
        phone: '13800138003',
        role: UserRole.CUSTOMS_OFFICER,
        orgName: '北京海关报关科',
      },
      {
        username: 'customs2',
        password: 'customs123',
        name: '赵六',
        email: 'zhaoliu@customs.com',
        phone: '13800138004',
        role: UserRole.CUSTOMS_OFFICER,
        orgName: '上海海关报关科',
      },
      {
        username: 'lab1',
        password: 'lab123',
        name: '孙七',
        email: 'sunqi@lab.com',
        phone: '13800138005',
        role: UserRole.CENTRAL_LAB,
        orgName: '国家食品药品检定研究院中心实验室',
      },
      {
        username: 'lab2',
        password: 'lab123',
        name: '周八',
        email: 'zhouba@lab.com',
        phone: '13800138006',
        role: UserRole.CENTRAL_LAB,
        orgName: '中国食品药品检定研究院中心实验室',
      },
    ], { individualHooks: true });

    console.log(`✓ Seeded ${users.length} users successfully`);
    console.log('  Default accounts:');
    console.log('  - admin / admin123 (系统管理员)');
    console.log('  - research1 / research123 (研究中心)');
    console.log('  - customs1 / customs123 (报关专员)');
    console.log('  - lab1 / lab123 (中心实验室)');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
