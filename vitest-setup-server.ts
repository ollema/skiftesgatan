import { createRequire } from 'node:module';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { vi } from 'vitest';
import Database from 'better-sqlite3';
import * as schema from './src/lib/server/db/schema';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as DrizzleKit from 'drizzle-kit/api';

// workaround for https://github.com/drizzle-team/drizzle-orm/issues/2853
const require = createRequire(import.meta.url);

const { generateSQLiteDrizzleJson, generateSQLiteMigration } =
	// eslint-disable-next-line import/no-commonjs
	require('drizzle-kit/api') as typeof DrizzleKit;
// end of workaround

// workaround for https://github.com/drizzle-team/drizzle-orm/issues/3913
async function pushSchema(db: BetterSQLite3Database<typeof schema>) {
	const prevJson = await generateSQLiteDrizzleJson({});
	const curJson = await generateSQLiteDrizzleJson(schema, prevJson.id, 'snake_case');
	const statements = await generateSQLiteMigration(prevJson, curJson);
	for (const statement of statements) {
		db.run(statement);
	}
}

vi.mock('./src/lib/server/db/index.ts', async () => {
	const db = drizzle(new Database(':memory:'), { schema });
	await pushSchema(db);
	return { db };
});
