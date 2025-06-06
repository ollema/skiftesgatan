# Database Scripts

## Seeding Script

The `seed.ts` script populates your local database with test data for development.

### What it creates:

**Test Users:**

- 6 test users with apartments A1101, A1102, B1201, B1202, C1301, D1401
- All users have password: `password123`
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

### Test Accounts:

After seeding, you can sign in with any of these accounts:

- **A1101**: user1@example.com (password: password123)
- **A1102**: user2@example.com (password: password123)
- **B1201**: user3@example.com (password: password123)
- **B1202**: user4@example.com (password: password123)
- **C1301**: user5@example.com (password: password123)
- **D1401**: user6@example.com (password: password123)
