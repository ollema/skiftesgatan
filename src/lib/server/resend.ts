import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

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

	const text = `
Påminnelse om din bokning

Hej,

Detta är en påminnelse om att din bokning av ${facilityName} börjar snart.

Detaljer:
- Lägenhet: ${apartment}
- Datum: ${bookingStart.toLocaleDateString('sv-SE')}
- Tid: ${bookingStart.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - ${bookingEnd.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}

Ha en bra dag!
	`.trim();

	const response = await resend.emails.send({
		from: 'Skiftesgatan <notifications@updates.skiftesgatan.com>',
		to: [isTestMode ? TEST_EMAIL : to],
		subject: isTestMode ? `[TEST] ${subject}` : subject,
		html: isTestMode
			? `<p><strong>TEST MODE:</strong> This email would have been sent to: ${to}</p><hr>${html}`
			: html,
		text: isTestMode ? `TEST MODE: This email would have been sent to: ${to}\n\n${text}` : text,
		scheduledAt: scheduledAt.toISOString(),
		headers: {
			'X-Idempotency-Key': idempotencyKey
		}
	});

	return response;
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(to: string, code: string) {
	const subject = 'Verifiera din emailadress';
	const html = `
		<h2>Verifiera din emailadress</h2>
		<p>Hej,</p>
		<p>Använd följande kod för att verifiera din nya emailadress:</p>
		<p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">${code}</p>
		<p>Koden är giltig i 10 minuter.</p>
		<p>Om du inte begärde detta kan du ignorera detta email.</p>
	`;

	const text = `
Verifiera din emailadress

Hej,

Använd följande kod för att verifiera din nya emailadress:

${code}

Koden är giltig i 10 minuter.

Om du inte begärde detta kan du ignorera detta email.
	`.trim();

	const response = await resend.emails.send({
		from: 'Skiftesgatan <auth@updates.skiftesgatan.com>',
		replyTo: 'support@skiftesgatan.com',
		to: [isTestMode ? TEST_EMAIL : to],
		subject: isTestMode ? `[TEST] ${subject}` : subject,
		html: isTestMode
			? `<p><strong>TEST MODE:</strong> This email would have been sent to: ${to}</p><hr>${html}`
			: html,
		text: isTestMode ? `TEST MODE: This email would have been sent to: ${to}\n\n${text}` : text
	});

	return response;
}

/**
 * Send password reset code
 */
export async function sendPasswordResetEmail(to: string, code: string) {
	const subject = 'Återställ ditt lösenord';
	const html = `
		<h2>Återställ ditt lösenord</h2>
		<p>Hej,</p>
		<p>Använd följande kod för att återställa ditt lösenord:</p>
		<p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">${code}</p>
		<p>Koden är giltig i 10 minuter.</p>
		<p>Om du inte begärde detta kan du ignorera detta email.</p>
	`;

	const text = `
Återställ ditt lösenord

Hej,

Använd följande kod för att återställa ditt lösenord:

${code}

Koden är giltig i 10 minuter.

Om du inte begärde detta kan du ignorera detta email.
	`.trim();

	const response = await resend.emails.send({
		from: 'Skiftesgatan <auth@updates.skiftesgatan.com>',
		replyTo: 'support@skiftesgatan.com',
		to: [isTestMode ? TEST_EMAIL : to],
		subject: isTestMode ? `[TEST] ${subject}` : subject,
		html: isTestMode
			? `<p><strong>TEST MODE:</strong> This email would have been sent to: ${to}</p><hr>${html}`
			: html,
		text: isTestMode ? `TEST MODE: This email would have been sent to: ${to}\n\n${text}` : text
	});

	return response;
}

/**
 * Update the scheduled time of an email
 */
export async function updateScheduledEmail(emailId: string, newScheduledAt: Date) {
	const response = await resend.emails.update({
		id: emailId,
		scheduledAt: newScheduledAt.toISOString()
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
