import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../auth/auth.model';
import { seedFactoryData } from '../dev.controller';

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/FOODHUB2_TEST';

describe('Dev Seed Controller - Fixed User Hashing', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Ensure clean state for test emails
    await User.deleteMany({ email: { $in: ['admin@foodhub.dev', 'random@test.com', 'keepme@test.com', 'deleteme@test.com'] } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin@foodhub.dev', 'random@test.com', 'keepme@test.com', 'deleteme@test.com'] } });
  });

  const fixedUserId = new mongoose.Types.ObjectId().toString();

  test('CASE 1: Database wiped. Seed inserts fixed user with bcrypt hashed password', async () => {
    const req = {
      body: {
        collections: [
          {
            modelName: 'User',
            clearFirst: false,
            documents: [
              {
                _id: fixedUserId,
                email: 'admin@foodhub.dev',
                name: 'admin',
                roles: ['admin'],
                password: 'devdev',
                phone: '1234567890',
                __isFixed: true
              },
              {
                _id: new mongoose.Types.ObjectId().toString(),
                email: 'random@test.com',
                name: 'random',
                roles: ['user'],
                password: 'dummy_password',
                phone: '0987654321'
              }
            ]
          }
        ]
      }
    };

    let statusCode = 200;
    let respData: any = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        respData = data;
      }
    };

    await seedFactoryData(req as any, res as any, () => {});

    expect(statusCode).toBe(201);
    expect(respData.success).toBe(true);
    
    const adminUser = await User.findById(fixedUserId).select('+password');
    expect(adminUser).not.toBeNull();
    
    // Test that it's NOT plain text
    expect(adminUser!.password).not.toBe('devdev');
    
    // Test that comparePassword works
    const isMatch = await adminUser!.comparePassword('devdev');
    expect(isMatch).toBe(true);

    const isWrongMatch = await adminUser!.comparePassword('wrong');
    expect(isWrongMatch).toBe(false);

    // Test that random user password is untouched
    const randomUser = await User.findOne({ email: 'random@test.com' }).select('+password');
    expect(randomUser!.password).toBe('dummy_password'); // Dummy unhashed
  });

  test('CASE 2: Database not wiped. Seed updates existing fixed user with devdev bcrypt hash', async () => {
    // Intentionally corrupt the password manually to simulate someone changing it or an old unhashed password
    await User.updateOne({ _id: fixedUserId }, { $set: { password: 'corrupted_password' } });
    
    let adminUser: any = await User.findById(fixedUserId).select('+password');
    expect(adminUser!.password).toBe('corrupted_password');
    let isMatch = await adminUser!.comparePassword('devdev');
    expect(isMatch).toBe(false);

    const req = {
      body: {
        collections: [
          {
            modelName: 'User',
            clearFirst: false,
            documents: [
              {
                _id: fixedUserId,
                email: 'admin@foodhub.dev',
                name: 'admin',
                roles: ['admin'],
                password: 'devdev',
                phone: '1234567890',
                __isFixed: true
              }
            ]
          }
        ]
      }
    };

    let statusCode = 200;
    let respData: any = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        respData = data;
      }
    };

    await seedFactoryData(req as any, res as any, () => {});

    // Even though it skips duplicate insertion, the password should be restored
    expect(statusCode).toBe(201);
    
    adminUser = await User.findById(fixedUserId).select('+password');
    expect(adminUser!.password).not.toBe('devdev');
    expect(adminUser!.password).not.toBe('corrupted_password');

    isMatch = await adminUser!.comparePassword('devdev');
    expect(isMatch).toBe(true);
  });

  test('CASE 3: Safety guard rejects clearFirst when unauthorized or on non-test DB', async () => {
    // Save original env
    const origEnv = process.env.NODE_ENV;
    const origAllow = process.env.ALLOW_DESTRUCTIVE_SEED;
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_DESTRUCTIVE_SEED;

    let statusCode = 200;
    let respData: any = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        respData = data;
      }
    };

    const req = {
      headers: {}, // no x-allow-destructive-seed
      body: {
        collections: [
          {
            modelName: 'User',
            clearFirst: true,
            documents: []
          }
        ]
      }
    };

    await seedFactoryData(req as any, res as any, () => {});

    expect(statusCode).toBe(403);
    expect(respData.success).toBe(false);
    expect(respData.message).toContain('Destructive clearFirst rejected');

    // Restore env
    process.env.NODE_ENV = origEnv;
    if (origAllow) process.env.ALLOW_DESTRUCTIVE_SEED = origAllow;
  });

  test('CASE 4: Scoped deletion via deleteIds removes only targeted records', async () => {
    // Insert two users
    const userToKeep = await User.create({
      email: 'keepme@test.com',
      name: 'Keep Me',
      password: 'password',
      roles: ['user']
    });
    const userToDelete = await User.create({
      email: 'deleteme@test.com',
      name: 'Delete Me',
      password: 'password',
      roles: ['user']
    });

    let statusCode = 200;
    let respData: any = null;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        respData = data;
      }
    };

    const req = {
      body: {
        collections: [
          {
            modelName: 'User',
            deleteIds: [userToDelete._id.toString()],
            documents: []
          }
        ]
      }
    };

    await seedFactoryData(req as any, res as any, () => {});

    expect(statusCode).toBe(201);
    expect(respData.success).toBe(true);

    const deletedCheck = await User.findById(userToDelete._id);
    expect(deletedCheck).toBeNull();

    const keptCheck = await User.findById(userToKeep._id);
    expect(keptCheck).not.toBeNull();

    // Clean up
    await User.deleteOne({ _id: userToKeep._id });
  });
});
