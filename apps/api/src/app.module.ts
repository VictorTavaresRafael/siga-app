import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExerciseHelpModule } from './modules/exercise-help/exercise-help.module';

@Module({
  imports: [AuthModule, UsersModule, WorkoutsModule, AttendanceModule, AnalyticsModule, NotificationsModule, ExerciseHelpModule],
})
export class AppModule {}
