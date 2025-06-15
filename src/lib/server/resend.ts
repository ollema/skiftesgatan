import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

if (!env.RESEND_API_KEY) {
	throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(env.RESEND_API_KEY);

const isTestMode = env.RESEND_TEST_MODE === 'true';
const TEST_EMAIL = 'delivered@resend.dev';

/**
 * Send a scheduled booking notification email
 */
export async function sendBookingNotification({
	to,
	bookingType,
	bookingStart,
	bookingEnd,
	apartment,
	scheduledAt,
	idempotencyKey
}: {
	to: string;
	bookingType: 'laundry' | 'bbq';
	bookingStart: Date;
	bookingEnd: Date;
	apartment: string;
	scheduledAt: Date;
	idempotencyKey: string;
}) {
	const facilityName = bookingType === 'laundry' ? 'tvättstugan' : 'grillen';
	const subject = `Påminnelse: Din ${bookingType === 'laundry' ? 'tvättid' : 'grilltid'} börjar snart`;

	const html = `
		<h2>Påminnelse om din bokning</h2>
		<p>Hej,</p>
		<p>Detta är en påminnelse om att din bokning av ${facilityName} börjar snart.</p>
		<p><strong>Detaljer:</strong></p>
		<ul>
			<li>Lägenhet: ${apartment}</li>
			<li>Datum: ${bookingStart.toLocaleDateString('sv-SE')}</li>
			<li>Tid: ${bookingStart.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - ${bookingEnd.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</li>
		</ul>
		<p>Ha en bra dag!</p>
	`;

	const response = await resend.emails.send({
		from: 'Skiftesgatan <notifications@skiftesgatan.se>',
		to: [isTestMode ? TEST_EMAIL : to],
		subject: isTestMode ? `[TEST] ${subject}` : subject,
		html: isTestMode
			? `<p><strong>TEST MODE:</strong> This email would have been sent to: ${to}</p><hr>${html}`
			: html,
		scheduledAt: scheduledAt.toISOString(),
		headers: {
			'X-Idempotency-Key': idempotencyKey
		}
	});

	return response;
}

/**
 * Cancel a scheduled email
 */
export async function cancelScheduledEmail(emailId: string) {
	const response = await resend.emails.cancel(emailId);
	return response;
}
