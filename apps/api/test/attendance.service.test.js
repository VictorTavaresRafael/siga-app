const test = require('node:test');
const assert = require('node:assert/strict');
const { AttendanceService } = require('../dist/modules/attendance/attendance.service.js');

test('AttendanceService.registerCheckIn avoids duplicate check-ins on same day', async () => {
  const prisma = {
    attendance: {
      findFirst: async () => ({ id: 'att-existing' }),
      create: async () => {
        throw new Error('create should not be called when check-in already exists');
      },
    },
  };

  const service = new AttendanceService(prisma);
  const result = await service.registerCheckIn('user-1');

  assert.deepEqual(result, { alreadyCheckedIn: true, attendanceId: 'att-existing' });
});

