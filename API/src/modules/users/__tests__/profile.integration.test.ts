import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';
import { User } from '../../auth/auth.model';

let token: string;
let user: any;
let otherUser: any;
let otherToken: string;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodhub-test';
  if (!uri.includes('test')) {
    throw new Error('Safety guard: Refusing to run tests against non-test database: ' + uri);
  }
  await mongoose.connect(uri);

  await User.deleteMany({});

  // Create test user
  const createdUser = await User.create({
    name: 'Profile Tester',
    email: 'profile@test.com',
    password: 'password123',
    roles: ['user'],
    status: 'active'
  });
  
  const createdOtherUser = await User.create({
    name: 'Other Tester',
    email: 'other@test.com',
    password: 'password123',
    roles: ['user'],
    status: 'active'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'profile@test.com', password: 'password123' });
    
  token = loginRes.body.data.token;
  user = createdUser;
  
  const loginResOther = await request(app)
    .post('/api/auth/login')
    .send({ email: 'other@test.com', password: 'password123' });
    
  otherToken = loginResOther.body.data.token;
  otherUser = createdOtherUser;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Customer Profile Architecture', () => {
  it('rejects unauthenticated profile updates', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(401);
  });

  it('allows authenticated user to update allowed fields', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', phone: '1234567890', avatar: 'base64str' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('New Name');
    expect(res.body.data.user.phone).toBe('1234567890');
    expect(res.body.data.user.avatar).toBe('base64str');
  });

  it('ignores forbidden fields', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'hacked@test.com', roles: ['admin'], status: 'blocked' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('profile@test.com');
    expect(res.body.data.user.roles).not.toContain('admin');
  });

  it('can add an address', async () => {
    const res = await request(app)
      .post('/api/users/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Home',
        phone: '123456',
        street: '123 Test St',
        city: 'Testville',
        type: 'home'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.addresses.length).toBe(1);
    expect(res.body.data.addresses[0].name).toBe('Home');
    expect(res.body.data.addresses[0].isDefault).toBe(true);
  });

  it('can remove an address', async () => {
    // Get current addresses
    const userDoc = await User.findById(user._id);
    const addressId = (userDoc!.addresses[0] as any)._id;

    const res = await request(app)
      .delete(`/api/users/addresses/${addressId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.addresses.length).toBe(0);
  });
});
