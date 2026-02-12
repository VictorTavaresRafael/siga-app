const test = require('node:test');
const assert = require('node:assert/strict');
const { UnauthorizedException } = require('@nestjs/common');
const { AuthService } = require('../dist/modules/auth/auth.service.js');

test('AuthService.login blocks inactive users', async () => {
  const usersService = {
    findByEmail: async () => ({
      id: 'u1',
      email: 'student@siga.com',
      role: 'STUDENT',
      password: '$2b$10$gROh8A9YwBfS5zOxqnN63.k9xl95k7OHQ4i4A4K/qUQ6Scf4tmQie', // "siga123"
      isActive: false,
    }),
  };

  const jwtService = { sign: () => 'jwt-token' };
  const service = new AuthService(usersService, jwtService);

  await assert.rejects(
    () => service.login({ email: 'student@siga.com', password: 'siga123' }),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.equal(error.message, 'Invalid credentials');
      return true;
    }
  );
});

