import { and, eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { booking, emailNotification, user, userPreferences } from './db/schema.js';
import { cancelScheduledEmail, sendBookingNotification, updateScheduledEmail } from './resend.js';
import { generateId } from './auth/utils.js';
import { getAllFutureBookingsForUser } from './bookings.js';

/**
 * Calculate notification time based on booking start and user preference
 */
function calculateNotificationTime(
	bookingStart: Date,
	timing: '1_hour' | '1_day' | '1_week'
): Date {
	const notificationTime = new Date(bookingStart);

	switch (timing) {
		case '1_hour':
			notificationTime.setHours(notificationTime.getHours() - 1);
			break;
		case '1_day':
			notificationTime.setDate(notificationTime.getDate() - 1);
			break;
		case '1_week':
			notificationTime.setDate(notificationTime.getDate() - 7);
			break;
	}

	return notificationTime;
}

/**
 * Schedule a notification for a booking
 */
export async function scheduleBookingNotification(bookingId: string) {
	const bookingData = db
		.select({
			booking: booking,
			user: user,
			preferences: userPreferences
		})
		.from(booking)
		.innerJoin(user, eq(booking.userId, user.id))
		.leftJoin(userPreferences, eq(user.id, userPreferences.userId))
		.where(eq(booking.id, bookingId))
		.get();

	if (!bookingData) {
		throw new Error(`Booking ${bookingId} not found`);
	}

	const { booking: bookingInfo, user: userInfo, preferences } = bookingData;

	const isNotificationsEnabled =
		bookingInfo.bookingType === 'laundry'
			? (preferences?.laundryNotificationsEnabled ?? true)
			: (preferences?.bbqNotificationsEnabled ?? true);

	if (!isNotificationsEnabled) {
		return; 
	}

	const timing =
		bookingInfo.bookingType === 'laundry'
			? (preferences?.laundryNotificationTiming ?? '1_hour')
			: (preferences?.bbqNotificationTiming ?? '1_week');

	const bookingStart = new Date(bookingInfo.start);
	const bookingEnd = new Date(bookingInfo.end);
	const scheduledAt = calculateNotificationTime(bookingStart, timing);

	if (scheduledAt <= new Date()) {
		return;
	}

	const notificationId = generateId();
	const idempotencyKey = `booking-${bookingId}-${timing}-${Date.now()}`;

	try {
		const resendResponse = await sendBookingNotification({
			to: userInfo.email,
			bookingType: bookingInfo.bookingType,
			bookingStart,
			bookingEnd,
			apartment: userInfo.apartment,
			scheduledAt,
			idempotencyKey
		});

		await db.insert(emailNotification).values({
			id: notificationId,
			bookingId: bookingInfo.id,
			userId: userInfo.id,
			scheduledAt,
			status: 'pending',
			resendId: resendResponse.data?.id,
			resendIdempotencyKey: idempotencyKey,
			createdAt: new Date()
		});

		return notificationId;
	} catch (error) {
		db.insert(emailNotification).values({
			id: notificationId,
			bookingId: bookingInfo.id,
			userId: userInfo.id,
			scheduledAt,
			status: 'failed',
			resendIdempotencyKey: idempotencyKey,
			error: error instanceof Error ? error.message : 'Unknown error',
			createdAt: new Date()
		});

		throw error;
	}
}

/**
 * Recalculate all pending notifications for a user with new preferences
 * Uses update API when possible, falls back to cancel+create when needed
 */
export async function recalculateUserNotifications(userId: string) {
	const userPrefs = db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, userId))
		.get();

	const futureBookings = getAllFutureBookingsForUser(userId);

	const pendingNotifications = await db
		.select({
			notification: emailNotification,
			booking: booking,
			user: user
		})
		.from(emailNotification)
		.innerJoin(booking, eq(emailNotification.bookingId, booking.id))
		.innerJoin(user, eq(emailNotification.userId, user.id))
		.where(and(eq(emailNotification.userId, userId), eq(emailNotification.status, 'pending')));

	for (const { notification, booking: notificationBooking } of pendingNotifications) {
		const isNotificationsEnabled =
			notificationBooking.bookingType === 'laundry'
				? (userPrefs?.laundryNotificationsEnabled ?? true)
				: (userPrefs?.bbqNotificationsEnabled ?? true);

		if (!isNotificationsEnabled) {
			if (notification.resendId) {
				try {
					await cancelScheduledEmail(notification.resendId);
				} catch (error) {
					console.error(`Failed to cancel email ${notification.resendId}:`, error);
				}
			}

			await db
				.update(emailNotification)
				.set({ status: 'cancelled' })
				.where(eq(emailNotification.id, notification.id));
			continue;
		}

		const newTiming =
			notificationBooking.bookingType === 'laundry'
				? (userPrefs?.laundryNotificationTiming ?? '1_hour')
				: (userPrefs?.bbqNotificationTiming ?? '1_week');

		const bookingStart = new Date(notificationBooking.start);
		const newScheduledAt = calculateNotificationTime(bookingStart, newTiming);

		if (newScheduledAt <= new Date()) {
			if (notification.resendId) {
				try {
					await cancelScheduledEmail(notification.resendId);
				} catch (error) {
					console.error(`Failed to cancel email ${notification.resendId}:`, error);
				}
			}

			await db
				.update(emailNotification)
				.set({ status: 'cancelled' })
				.where(eq(emailNotification.id, notification.id));
			continue;
		}

		if (notification.resendId) {
			try {
				await updateScheduledEmail(notification.resendId, newScheduledAt);

				await db
					.update(emailNotification)
					.set({ scheduledAt: newScheduledAt })
					.where(eq(emailNotification.id, notification.id));

				continue;
			} catch (error) {
				console.error(
					`Failed to update email ${notification.resendId}, falling back to cancel+create:`,
					error
				);

				try {
					await cancelScheduledEmail(notification.resendId);
				} catch (cancelError) {
					console.error(`Failed to cancel email ${notification.resendId}:`, cancelError);
				}
			}
		}

		await db
			.update(emailNotification)
			.set({ status: 'cancelled' })
			.where(eq(emailNotification.id, notification.id));

		try {
			await scheduleBookingNotification(notificationBooking.id);
		} catch (error) {
			console.error(
				`Failed to reschedule notification for booking ${notificationBooking.id}:`,
				error
			);
		}
	}

	const bookingIdsWithNotifications = new Set(
		pendingNotifications.map(({ notification }) => notification.bookingId)
	);

	for (const futureBooking of futureBookings) {
		if (!bookingIdsWithNotifications.has(futureBooking.id)) {
			try {
				await scheduleBookingNotification(futureBooking.id);
			} catch (error) {
				console.error(`Failed to schedule notification for booking ${futureBooking.id}:`, error);
			}
		}
	}
}

/**
 * Cancel all notifications for a specific booking (when booking is deleted)
 */
export async function cancelBookingNotifications(bookingId: string) {
	const notifications = await db
		.select()
		.from(emailNotification)
		.where(
			and(eq(emailNotification.bookingId, bookingId), eq(emailNotification.status, 'pending'))
		);

	for (const notification of notifications) {
		if (notification.resendId) {
			try {
				await cancelScheduledEmail(notification.resendId);
			} catch (error) {
				console.error(`Failed to cancel email ${notification.resendId}:`, error);
			}
		}

		await db
			.update(emailNotification)
			.set({ status: 'cancelled' })
			.where(eq(emailNotification.id, notification.id));
	}
}
