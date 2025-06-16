import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	apartment: text('apartment').notNull().unique(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const emailVerificationRequest = sqliteTable('email_verification_request', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	email: text('email').notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const passwordResetSession = sqliteTable('password_reset_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	email: text('email').notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false)
});

export const booking = sqliteTable('booking', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	bookingType: text('booking_type', { enum: ['laundry', 'bbq'] }).notNull(),
	start: text('start').notNull(),
	end: text('end').notNull(),
	createdAt: text('created_at').notNull()
});

export const userPreferences = sqliteTable('user_preferences', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
		.unique(),
	laundryNotificationsEnabled: integer('laundry_notifications_enabled', { mode: 'boolean' })
		.notNull()
		.default(false),
	laundryNotificationTiming: text('laundry_notification_timing', {
		enum: ['1_hour', '1_day', '1_week']
	})
		.notNull()
		.default('1_hour'),
	bbqNotificationsEnabled: integer('bbq_notifications_enabled', { mode: 'boolean' })
		.notNull()
		.default(false),
	bbqNotificationTiming: text('bbq_notification_timing', { enum: ['1_hour', '1_day', '1_week'] })
		.notNull()
		.default('1_week')
});

export const emailNotification = sqliteTable('email_notification', {
	id: text('id').primaryKey(),
	bookingId: text('booking_id')
		.notNull()
		.references(() => booking.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
	status: text('status', { enum: ['pending', 'sent', 'failed', 'cancelled'] })
		.notNull()
		.default('pending'),
	resendId: text('resend_id'),
	resendIdempotencyKey: text('resend_idempotency_key').unique(),
	error: text('error'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
