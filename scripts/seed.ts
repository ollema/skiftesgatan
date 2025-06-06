#!/usr/bin/env tsx

/**
 * Database seeding script for local development
 *
 * Creates test users and bookings for the current month.
 *
 * Usage:
 *   npm run seed
 *   or
 *   npx tsx scripts/seed.ts
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { CalendarDateTime } from '@internationalized/date';
import { hashPassword } from '../src/lib/server/auth/password';
import { generateUserId } from '../src/lib/server/auth/user';
import { generateBookingId, LAUNDRY_SLOTS, BBQ_SLOT, timezone } from '../src/lib/server/bookings';
import * as schema from '../src/lib/server/db/schema';

// Get database URL from environment or use default
const DATABASE_URL = process.env.DATABASE_URL || './local.db';

console.log('🌱 Starting database seed...');
console.log(`📁 Database: ${DATABASE_URL}`);

const client = new Database(DATABASE_URL);
const db = drizzle(client, { schema });

// Test users data
const testUsers = [
	{ apartment: 'A1101', email: 'user1@example.com', password: 'password123' },
	{ apartment: 'A1102', email: 'user2@example.com', password: 'password123' },
	{ apartment: 'B1201', email: 'user3@example.com', password: 'password123' },
	{ apartment: 'B1202', email: 'user4@example.com', password: 'password123' },
	{ apartment: 'C1301', email: 'user5@example.com', password: 'password123' },
	{ apartment: 'D1401', email: 'user6@example.com', password: 'password123' }
];

async function createTestUsers() {
	console.log('👥 Creating test users...');

	const users = [];

	for (const userData of testUsers) {
		const userId = generateUserId();
		const passwordHash = await hashPassword(userData.password);

		const user = {
			id: userId,
			apartment: userData.apartment,
			email: userData.email,
			emailVerified: true,
			passwordHash
		};

		// Insert user
		db.insert(schema.user).values(user).run();
		users.push(user);

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

		const startTime = new CalendarDateTime(currentYear, currentMonth, day, slot.start, 0, 0, 0);
		const endTime = new CalendarDateTime(currentYear, currentMonth, day, slot.end, 0, 0, 0);

		const booking = {
			id: generateBookingId(),
			userId: users[userIndex].id,
			bookingType: 'laundry' as const,
			startTime: startTime.toDate(timezone),
			endTime: endTime.toDate(timezone),
			createdAt: new Date()
		};

		db.insert(schema.booking).values(booking).run();
		bookingCount++;

		console.log(
			`  ✅ Laundry booking: ${users[userIndex].apartment} on ${currentMonth}/${day} ${slot.label}`
		);
	}

	// Create some BBQ bookings
	for (let day = 2; day <= Math.min(daysInMonth, 10); day += 4) {
		const userIndex = (day + 1) % users.length;

		const startTime = new CalendarDateTime(currentYear, currentMonth, day, BBQ_SLOT.start, 0, 0, 0);
		const endTime = new CalendarDateTime(currentYear, currentMonth, day, BBQ_SLOT.end, 0, 0, 0);

		const booking = {
			id: generateBookingId(),
			userId: users[userIndex].id,
			bookingType: 'bbq' as const,
			startTime: startTime.toDate(timezone),
			endTime: endTime.toDate(timezone),
			createdAt: new Date()
		};

		db.insert(schema.booking).values(booking).run();
		bookingCount++;

		console.log(
			`  ✅ BBQ booking: ${users[userIndex].apartment} on ${currentMonth}/${day} ${BBQ_SLOT.label}`
		);
	}

	// Create some future bookings for next few days
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowMonth = tomorrow.getMonth() + 1;
	const tomorrowDay = tomorrow.getDate();
	const tomorrowYear = tomorrow.getFullYear();

	if (tomorrowDay <= daysInMonth) {
		// Tomorrow laundry booking
		const startTime = new CalendarDateTime(
			tomorrowYear,
			tomorrowMonth,
			tomorrowDay,
			LAUNDRY_SLOTS[1].start,
			0,
			0,
			0
		);
		const endTime = new CalendarDateTime(
			tomorrowYear,
			tomorrowMonth,
			tomorrowDay,
			LAUNDRY_SLOTS[1].end,
			0,
			0,
			0
		);

		const booking = {
			id: generateBookingId(),
			userId: users[0].id,
			bookingType: 'laundry' as const,
			startTime: startTime.toDate(timezone),
			endTime: endTime.toDate(timezone),
			createdAt: new Date()
		};

		db.insert(schema.booking).values(booking).run();
		bookingCount++;

		console.log(
			`  ✅ Future laundry booking: ${users[0].apartment} tomorrow ${LAUNDRY_SLOTS[1].label}`
		);
	}

	console.log(`📊 Created ${bookingCount} test bookings`);
}

async function seed() {
	try {
		// Clear existing data (optional - comment out if you want to keep existing data)
		console.log('🧹 Clearing existing test data...');
		db.delete(schema.booking).run();
		db.delete(schema.session).run();
		db.delete(schema.emailVerificationRequest).run();
		db.delete(schema.passwordResetSession).run();
		db.delete(schema.user).run();

		// Create test data
		const users = await createTestUsers();
		createTestBookings(users);

		console.log('');
		console.log('🎉 Seeding completed successfully!');
		console.log('');
		console.log('📋 Test users created:');
		testUsers.forEach((user) => {
			console.log(`  👤 ${user.apartment}: ${user.email} (password: ${user.password})`);
		});
		console.log('');
		console.log('🚀 You can now sign in with any of these test accounts!');
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	} finally {
		client.close();
	}
}

// Run the seed function
seed();
