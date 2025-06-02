import { describe, it, expect } from 'vitest';
import { verifyEmailInput } from '$lib/server/auth/email';

describe('verifyEmailInput', () => {
	describe('valid emails', () => {
		it('should accept standard email formats', () => {
			const validEmails = [
				'test@example.com',
				'user@domain.org',
				'admin@site.net',
				'hello@world.co.uk',
				'contact@company.io'
			];

			validEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should accept emails with numbers', () => {
			const emailsWithNumbers = [
				'user123@example.com',
				'test2024@domain.org',
				'123test@site.net',
				'user@domain123.com'
			];

			emailsWithNumbers.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should accept emails with special characters in local part', () => {
			const specialCharEmails = [
				'user.name@example.com',
				'user+tag@example.com',
				'user_name@example.com',
				'user-name@example.com',
				'first.last+tag@example.com'
			];

			specialCharEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should accept emails with subdomains', () => {
			const subdomainEmails = [
				'user@mail.example.com',
				'test@sub.domain.org',
				'admin@deep.sub.domain.net'
			];

			subdomainEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should accept international domain names', () => {
			const internationalEmails = ['test@example.co.uk', 'user@site.com.au', 'admin@domain.org.za'];

			internationalEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should accept single character local and domain parts with valid TLD', () => {
			expect(verifyEmailInput('a@b.co')).toBe(true);
		});
	});

	describe('invalid emails', () => {
		it('should reject emails without @ symbol', () => {
			const noAtEmails = ['testexample.com', 'user.domain.org', 'adminssite.net'];

			noAtEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails without domain', () => {
			const noDomainEmails = ['test@', 'user@.', 'admin@.com'];

			noDomainEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails without local part', () => {
			const noLocalEmails = ['@example.com', '@domain.org', '@site.net'];

			noLocalEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails without TLD', () => {
			const noTldEmails = ['test@example', 'user@domain', 'admin@site'];

			noTldEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails with multiple @ symbols', () => {
			const multipleAtEmails = ['test@@example.com', 'user@domain@org', 'admin@site@net'];

			multipleAtEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject empty string', () => {
			expect(verifyEmailInput('')).toBe(false);
		});

		it('should reject whitespace only', () => {
			const whitespaceEmails = [' ', '  ', '\t', '\n'];

			whitespaceEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails with spaces', () => {
			const spacedEmails = [
				'test @example.com',
				'test@ example.com',
				'test@example .com',
				' test@example.com',
				'test@example.com '
			];

			spacedEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});
	});

	describe('length validation', () => {
		it('should accept emails up to 255 characters', () => {
			// create email exactly 255 characters long
			const longLocalPart = 'a'.repeat(64); // max local part length
			const longDomain = 'b'.repeat(186) + '.com'; // fill remaining space
			const email255 = `${longLocalPart}@${longDomain}`;

			expect(email255.length).toBe(255);
			expect(verifyEmailInput(email255)).toBe(true);
		});

		it('should reject emails longer than 255 characters', () => {
			// create email 256 characters long
			const longLocalPart = 'a'.repeat(64);
			const longDomain = 'b'.repeat(187) + '.com'; // one character too many
			const email256 = `${longLocalPart}@${longDomain}`;

			expect(email256.length).toBe(256);
			expect(verifyEmailInput(email256)).toBe(false);
		});

		it('should reject very long emails', () => {
			const veryLongEmail = 'test@' + 'a'.repeat(500) + '.com';
			expect(verifyEmailInput(veryLongEmail)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle unicode characters', () => {
			// test with unicode characters - these should work with the current regex
			// since [^\s@] doesn't exclude unicode letters
			const unicodeEmails = ['tëst@example.com', 'test@éxample.com', '用户@example.com'];

			unicodeEmails.forEach((email) => {
				// these should pass with the stricter regex as long as they don't contain @ or spaces
				expect(verifyEmailInput(email)).toBe(true);
			});
		});

		it('should handle very short valid emails', () => {
			expect(verifyEmailInput('a@b.co')).toBe(true);
		});

		it('should reject malformed endings', () => {
			const malformedEmails = [
				'test@example.', // no TLD
				'test@example.c.', // ends with dot
				'test@example.c' // TLD too short
			];

			malformedEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});

		it('should reject emails with insufficient TLD', () => {
			const invalidTldEmails = [
				'test@example.', // no TLD after dot
				'test@example.c', // TLD too short (only 1 char)
				'test@.com' // domain starts with dot
			];

			invalidTldEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});
	});

	describe('regex pattern behavior', () => {
		it('should use stricter pattern matching', () => {
			// test that it uses the pattern: /^[^\s@]+@[^\s@]+\.[a-zA-Z0-9]{2,}$/
			// this means: start, non-whitespace/@ chars, @, non-whitespace/@ chars, dot, 2+ alphanumeric chars, end

			// should pass - meets requirements
			expect(verifyEmailInput('x@y.zz')).toBe(true);

			// should fail - no dot after @
			expect(verifyEmailInput('x@yz')).toBe(false);

			// should fail - starts with @
			expect(verifyEmailInput('@y.zz')).toBe(false);

			// should fail - TLD too short
			expect(verifyEmailInput('x@y.z')).toBe(false);

			// should fail - contains spaces
			expect(verifyEmailInput('x @y.zz')).toBe(false);

			// should fail - multiple @
			expect(verifyEmailInput('x@@y.zz')).toBe(false);

			// should fail - TLD contains dot
			expect(verifyEmailInput('x@y.c.')).toBe(false);
		});

		it('should require minimum TLD length of 2 alphanumeric characters', () => {
			expect(verifyEmailInput('test@example.co')).toBe(true);
			expect(verifyEmailInput('test@example.com')).toBe(true);
			expect(verifyEmailInput('test@example.c')).toBe(false);
			expect(verifyEmailInput('test@example.c.')).toBe(false);
		});

		it('should reject emails with @ in domain part', () => {
			const invalidEmails = ['test@exam@ple.com', 'test@example@.com'];

			invalidEmails.forEach((email) => {
				expect(verifyEmailInput(email)).toBe(false);
			});
		});
	});
});
