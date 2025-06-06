#!/usr/bin/env tsx

/**
 * Standalone database seeding script for local development
 *
 * Creates test users and bookings for the current month.
 * Does not import any application code - works directly with the database schema.
 *
 * Usage:
 *   npm run seed
 *   or
 *   npx tsx scripts/seed.ts
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Get database URL from environment or use default
const DATABASE_URL = process.env.DATABASE_URL || './local.db';

console.log('🌱 Starting database seed...');
console.log(`📁 Database: ${DATABASE_URL}`);

const client = new Database(DATABASE_URL);
const db = drizzle(client);

// Define schema (duplicate of the real schema but standalone)
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
	startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
	endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// Utility functions (standalone, not imported)
function generateRandomId(length = 15): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// Placeholder password hash since we won't be logging in with these accounts
const PLACEHOLDER_PASSWORD_HASH = 'placeholder_hash_not_for_login';

// Test users data (just for apartment and email - not for login)
const testUsers = [
	{ apartment: 'A1101', email: 'user1@example.com' },
	{ apartment: 'A1102', email: 'user2@example.com' },
	{ apartment: 'B1201', email: 'user3@example.com' },
	{ apartment: 'B1202', email: 'user4@example.com' },
	{ apartment: 'C1301', email: 'user5@example.com' },
	{ apartment: 'D1401', email: 'user6@example.com' }
];

// Laundry time slots (hardcoded from the app)
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

		// Insert user
		db.insert(user).values(userRecord).run();
		users.push(userRecord);

		console.log(`  ✅ Created user: ${userData.apartment} (${userData.email})`);
	}

	return users;
}

function createTestBookings(users: any[]) {
	console.log('📅 Creating test bookings for current month...');

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	// Get number of days in current month
	const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

	let bookingCount = 0;

	// Create some laundry bookings
	for (let day = 1; day <= Math.min(daysInMonth, 15); day += 3) {
		const userIndex = (day - 1) % users.length;
		const slotIndex = Math.floor(Math.random() * LAUNDRY_SLOTS.length);
		const slot = LAUNDRY_SLOTS[slotIndex];

		// Create start and end times
		const startTime = new Date(currentYear, currentMonth - 1, day, slot.start, 0, 0, 0);
		const endTime = new Date(currentYear, currentMonth - 1, day, slot.end, 0, 0, 0);

		const bookingRecord = {
			id: generateRandomId(),
			userId: users[userIndex].id,
			bookingType: 'laundry' as const,
			startTime: startTime,
			endTime: endTime,
			createdAt: new Date()
		};

		db.insert(booking).values(bookingRecord).run();
		bookingCount++;

		console.log(
			`  ✅ Laundry booking: ${users[userIndex].apartment} on ${currentMonth}/${day} ${slot.label}`
		);
	}

	// Create some BBQ bookings
	for (let day = 2; day <= Math.min(daysInMonth, 10); day += 4) {
		const userIndex = (day + 1) % users.length;

		const startTime = new Date(currentYear, currentMonth - 1, day, BBQ_SLOT.start, 0, 0, 0);
		const endTime = new Date(currentYear, currentMonth - 1, day, BBQ_SLOT.end, 0, 0, 0);

		const bookingRecord = {
			id: generateRandomId(),
			userId: users[userIndex].id,
			bookingType: 'bbq' as const,
			startTime: startTime,
			endTime: endTime,
			createdAt: new Date()
		};

		db.insert(booking).values(bookingRecord).run();
		bookingCount++;

		console.log(
			`  ✅ BBQ booking: ${users[userIndex].apartment} on ${currentMonth}/${day} ${BBQ_SLOT.label}`
		);
	}

	// Create a future booking for tomorrow (if within current month)
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	if (tomorrow.getMonth() + 1 === currentMonth && tomorrow.getDate() <= daysInMonth) {
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
			startTime: startTime,
			endTime: endTime,
			createdAt: new Date()
		};

		db.insert(booking).values(bookingRecord).run();
		bookingCount++;

		console.log(
			`  ✅ Future laundry booking: ${users[0].apartment} tomorrow ${LAUNDRY_SLOTS[1].label}`
		);
	}

	console.log(`📊 Created ${bookingCount} test bookings`);
}

function seed() {
	try {
		// Clear existing data (optional - comment out if you want to keep existing data)
		console.log('🧹 Clearing existing test data...');
		db.delete(booking).run();
		db.delete(session).run();
		db.delete(emailVerificationRequest).run();
		db.delete(passwordResetSession).run();
		db.delete(user).run();

		// Create test data
		const users = createTestUsers();
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

// Run the seed function
seed();
