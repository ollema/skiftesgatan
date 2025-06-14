#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const DATABASE_URL = process.env.DATABASE_URL || './local.db';

console.log('🌱 Starting database seed...');
console.log(`📁 Database: ${DATABASE_URL}`);

const client = new Database(DATABASE_URL);
const db = drizzle(client);

const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	apartment: text('apartment').notNull().unique(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	passwordHash: text('password_hash').notNull()
});

const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

const emailVerificationRequest = sqliteTable('email_verification_request', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	email: text('email').notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

const passwordResetSession = sqliteTable('password_reset_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	email: text('email').notNull(),
	code: text('code').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false)
});

const booking = sqliteTable('booking', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	bookingType: text('booking_type', { enum: ['laundry', 'bbq'] }).notNull(),
	start: text('start').notNull(),
	end: text('end').notNull(),
	createdAt: text('created_at').notNull()
});

const userPreferences = sqliteTable('user_preferences', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id)
		.unique(),
	laundryNotificationsEnabled: integer('laundry_notifications_enabled', { mode: 'boolean' })
		.notNull()
		.default(true),
	laundryNotificationTiming: text('laundry_notification_timing', {
		enum: ['1_hour', '1_day', '1_week']
	})
		.notNull()
		.default('1_hour'),
	bbqNotificationsEnabled: integer('bbq_notifications_enabled', { mode: 'boolean' })
		.notNull()
		.default(true),
	bbqNotificationTiming: text('bbq_notification_timing', { enum: ['1_hour', '1_day', '1_week'] })
		.notNull()
		.default('1_week')
});

function generateRandomId(length = 15): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function formatToISOString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

const PLACEHOLDER_PASSWORD_HASH = 'placeholder_hash_not_for_login';

const testUsers = [
	{ apartment: 'A1101', email: 'user1@example.com' },
	{ apartment: 'A1102', email: 'user2@example.com' },
	{ apartment: 'B1201', email: 'user3@example.com' },
	{ apartment: 'B1202', email: 'user4@example.com' },
	{ apartment: 'C1301', email: 'user5@example.com' },
	{ apartment: 'D1401', email: 'user6@example.com' }
];

const LAUNDRY_SLOTS = [
	{ start: 7, end: 11, label: '07:00-11:00' },
	{ start: 11, end: 15, label: '11:00-15:00' },
	{ start: 15, end: 19, label: '15:00-19:00' },
	{ start: 19, end: 22, label: '19:00-22:00' }
];

const BBQ_SLOT = { start: 8, end: 20, label: '08:00-20:00' };

function createTestUsers() {
	console.log('👥 Creating test users...');

	const users: {
		id: string;
		apartment: string;
		email: string;
		emailVerified: boolean;
		passwordHash: string;
	}[] = [];

	for (const userData of testUsers) {
		const userId = generateRandomId();

		const userRecord = {
			id: userId,
			apartment: userData.apartment,
			email: userData.email,
			emailVerified: true,
			passwordHash: PLACEHOLDER_PASSWORD_HASH
		};

		db.insert(user).values(userRecord).run();
		users.push(userRecord);

		console.log(`  ✅ Created user: ${userData.apartment} (${userData.email})`);
	}

	return users;
}

function createUserPreferences(users: any[]) {
	console.log('⚙️  Creating user preferences...');

	for (const user of users) {
		const preferencesRecord = {
			id: generateRandomId(),
			userId: user.id,
			laundryNotificationsEnabled: true,
			laundryNotificationTiming: '1_hour' as const,
			bbqNotificationsEnabled: true,
			bbqNotificationTiming: '1_week' as const
		};

		db.insert(userPreferences).values(preferencesRecord).run();
		console.log(`  ✅ Created preferences for: ${user.apartment}`);
	}
}

function createTestBookings(users: any[]) {
	console.log('📅 Creating test bookings for next 4 weeks...');

	const now = new Date();
	let bookingCount = 0;

	for (let dayOffset = 1; dayOffset <= 28; dayOffset += 2) {
		const bookingDate = new Date(now);
		bookingDate.setDate(now.getDate() + dayOffset);

		const userIndex = (dayOffset - 1) % users.length;
		const slotIndex = Math.floor(Math.random() * LAUNDRY_SLOTS.length);
		const slot = LAUNDRY_SLOTS[slotIndex];

		const startTime = new Date(
			bookingDate.getFullYear(),
			bookingDate.getMonth(),
			bookingDate.getDate(),
			slot.start,
			0,
			0,
			0
		);
		const endTime = new Date(
			bookingDate.getFullYear(),
			bookingDate.getMonth(),
			bookingDate.getDate(),
			slot.end,
			0,
			0,
			0
		);

		const bookingRecord = {
			id: generateRandomId(),
			userId: users[userIndex].id,
			bookingType: 'laundry' as const,
			start: formatToISOString(startTime),
			end: formatToISOString(endTime),
			createdAt: formatToISOString(new Date())
		};

		db.insert(booking).values(bookingRecord).run();
		bookingCount++;

		console.log(
			`  ✅ Laundry booking: ${users[userIndex].apartment} on ${bookingDate.getMonth() + 1}/${bookingDate.getDate()} ${slot.label}`
		);
	}

	for (let dayOffset = 3; dayOffset <= 25; dayOffset += 5) {
		const bookingDate = new Date(now);
		bookingDate.setDate(now.getDate() + dayOffset);

		const userIndex = (dayOffset + 1) % users.length;

		const startTime = new Date(
			bookingDate.getFullYear(),
			bookingDate.getMonth(),
			bookingDate.getDate(),
			BBQ_SLOT.start,
			0,
			0,
			0
		);
		const endTime = new Date(
			bookingDate.getFullYear(),
			bookingDate.getMonth(),
			bookingDate.getDate(),
			BBQ_SLOT.end,
			0,
			0,
			0
		);

		const bookingRecord = {
			id: generateRandomId(),
			userId: users[userIndex].id,
			bookingType: 'bbq' as const,
			start: formatToISOString(startTime),
			end: formatToISOString(endTime),
			createdAt: formatToISOString(new Date())
		};

		db.insert(booking).values(bookingRecord).run();
		bookingCount++;

		console.log(
			`  ✅ BBQ booking: ${users[userIndex].apartment} on ${bookingDate.getMonth() + 1}/${bookingDate.getDate()} ${BBQ_SLOT.label}`
		);
	}

	const tomorrow = new Date(now);
	tomorrow.setDate(now.getDate() + 1);

	const startTime = new Date(
		tomorrow.getFullYear(),
		tomorrow.getMonth(),
		tomorrow.getDate(),
		LAUNDRY_SLOTS[1].start,
		0,
		0,
		0
	);
	const endTime = new Date(
		tomorrow.getFullYear(),
		tomorrow.getMonth(),
		tomorrow.getDate(),
		LAUNDRY_SLOTS[1].end,
		0,
		0,
		0
	);

	const bookingRecord = {
		id: generateRandomId(),
		userId: users[0].id,
		bookingType: 'laundry' as const,
		start: formatToISOString(startTime),
		end: formatToISOString(endTime),
		createdAt: formatToISOString(new Date())
	};

	db.insert(booking).values(bookingRecord).run();
	bookingCount++;

	console.log(
		`  ✅ Future laundry booking: ${users[0].apartment} tomorrow ${LAUNDRY_SLOTS[1].label}`
	);

	console.log(`📊 Created ${bookingCount} test bookings`);
}

function seed() {
	try {
		console.log('🧹 Clearing existing test data...');
		db.delete(booking).run();
		db.delete(userPreferences).run();
		db.delete(session).run();
		db.delete(emailVerificationRequest).run();
		db.delete(passwordResetSession).run();
		db.delete(user).run();

		const users = createTestUsers();
		createUserPreferences(users);
		createTestBookings(users);

		console.log('');
		console.log('🎉 Seeding completed successfully!');
		console.log('');
		console.log('📋 Test users created (for testing bookings display only):');
		testUsers.forEach((userData) => {
			console.log(`  👤 ${userData.apartment}: ${userData.email}`);
		});
		console.log('');
		console.log('ℹ️  Note: These accounts are for testing booking display only - not for login');
		console.log('🚀 Create real accounts through the app if you need to test authentication!');
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	} finally {
		client.close();
	}
}

seed();
