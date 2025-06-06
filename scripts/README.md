# Database Scripts

## Seeding Script

The `seed.ts` script populates your local database with test data for development.

**Standalone & Brittle by Design**: This script doesn't import any application code - it works directly with the database schema. This makes it simpler but means it needs to be updated if the schema changes.

### What it creates:

**Test Users:**

- 6 test users with apartments A1101, A1102, B1201, B1202, C1301, D1401
- Placeholder passwords (not for login - just for testing booking display)
- All users have verified emails

**Test Bookings:**

- Various laundry bookings throughout the current month
- Various BBQ bookings throughout the current month
- One future laundry booking for tomorrow (if possible)

### Usage:

```bash
# Install dependencies first (if not already done)
pnpm install

# Run the seed script
pnpm run seed

# Or run directly with tsx
npx tsx scripts/seed.ts
```

### Environment:

The script uses the `DATABASE_URL` environment variable or defaults to `./local.db`.

### Note:

⚠️ **The script clears all existing data before seeding!**

If you want to keep existing data, comment out the delete statements in the script.

### Test Users Created:

The script creates these test users (for booking display only):

- **A1101**: user1@example.com
- **A1102**: user2@example.com
- **B1201**: user3@example.com
- **B1202**: user4@example.com
- **C1301**: user5@example.com
- **D1401**: user6@example.com

### Important Notes:

ℹ️ **Not for login**: These accounts are just for testing the booking display. Create real accounts through the app for authentication testing.

⚠️ **Standalone**: This script duplicates the database schema and doesn't import any app code, making it brittle but self-contained.
