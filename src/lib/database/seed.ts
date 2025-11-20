import dbConnect from './mongodb';
import User from '../models/User';
import WorkLog from '../models/WorkLog';

export async function seedDatabase() {
  try {
    await dbConnect();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await WorkLog.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const users = [
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@timewise.com',
        password: 'admin123',
        role: 'Admin' as const,
        isActive: true,
      },
      {
        name: 'Developer',
        email: 'developer@timewise.com',
        password: 'dev123',
        role: 'Developer' as const,
        isActive: true,
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@timewise.com',
        password: 'user123',
        role: 'User' as const,
        isActive: true,
      },
      {
        name: 'James Smith',
        email: 'james.smith@timewise.com',
        password: 'user123',
        role: 'User' as const,
        isActive: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@timewise.com',
        password: 'user123',
        role: 'User' as const,
        isActive: true,
      },
      {
        name: 'Kenji Tanaka',
        email: 'kenji.tanaka@timewise.com',
        password: 'user123',
        role: 'User' as const,
        isActive: true,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save(); // This triggers the pre-save hook for password hashing
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample work logs
    console.log('📋 Creating sample work logs...');
    const verticles = ['CMIS', 'TRI', 'LOF', 'TRG'];
    const countries = ['USA', 'UK', 'Canada', 'Australia', 'Japan'];
    const tasks = [
      'Video Editing',
      'Graphic Design',
      'Sound Mixing',
      'Animation',
      'Project Management',
      'Client Meeting',
      'Research & Development',
      'Quality Assurance',
      'Content Creation',
      'Code Review',
    ];

    const workLogs = [];
    
    // Generate work logs for the last 30 days
    for (let i = 0; i < 75; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const workDate = new Date();
      workDate.setDate(workDate.getDate() - daysAgo);
      
      // Random creation time (could be same day as work or a few days later)
      const createdDate = new Date(workDate);
      const creationDelayDays = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3);
      createdDate.setDate(createdDate.getDate() + creationDelayDays);
      
      workLogs.push({
        userId: user.userId,
        date: workDate,
        verticle: verticles[Math.floor(Math.random() * verticles.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        task: tasks[Math.floor(Math.random() * tasks.length)],
        hours: Math.floor(Math.random() * 8 + 1), // 1-8 hours
        minutes: [0, 15, 30, 45][Math.floor(Math.random() * 4)], // 0, 15, 30, or 45 minutes
        createdAt: createdDate,
        updatedAt: createdDate,
      });
    }

    const createdWorkLogs = await WorkLog.insertMany(workLogs);
    console.log(`✅ Created ${createdWorkLogs.length} work logs`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: alex.johnson@timewise.com / admin123');
    console.log('Users: [name]@timewise.com / user123');
    
    return {
      users: createdUsers.length,
      workLogs: createdWorkLogs.length,
    };
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}