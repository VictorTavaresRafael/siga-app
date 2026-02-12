const test = require('node:test');
const assert = require('node:assert/strict');
const { UsersService } = require('../dist/modules/users/users.service.js');

test('UsersService.deactivateStudent sets isActive=false and omits password', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }) => ({ id: where.id }),
      update: async ({ where }) => ({
        id: where.id,
        email: 'student@siga.com',
        name: 'Student',
        role: 'STUDENT',
        isActive: false,
        password: 'hashed',
      }),
    },
  };

  const service = new UsersService(prisma);
  const result = await service.deactivateStudent('user-1');

  assert.equal(result.isActive, false);
  assert.equal(result.id, 'user-1');
  assert.equal('password' in result, false);
});

