/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export enum Collections {
	Apartments = 'apartments',
	Content = 'content',
	Reservations = 'reservations',
	Users = 'users'
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString;
	created: IsoDateString;
	updated: IsoDateString;
	collectionId: string;
	collectionName: Collections;
	expand?: T;
};

export type AuthSystemFields<T = never> = {
	email: string;
	emailVisibility: boolean;
	username: string;
	verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type ApartmentsRecord = {
	apartment: string;
	owners?: RecordIdString[];
	size: number;
	subtenants?: RecordIdString[];
};

export type ContentRecord = {
	content: HTMLString;
	description?: string;
	slug: string;
	title: string;
};

export enum ReservationsTypeOptions {
	'laundry' = 'laundry'
}
export type ReservationsRecord = {
	apartment: RecordIdString;
	end: IsoDateString;
	start: IsoDateString;
	type: ReservationsTypeOptions;
};

export type UsersRecord = {
	avatar?: string;
	name?: string;
};

// Response types include system fields and match responses from the PocketBase API
export type ApartmentsResponse<Texpand = unknown> = Required<ApartmentsRecord> &
	BaseSystemFields<Texpand>;
export type ContentResponse<Texpand = unknown> = Required<ContentRecord> &
	BaseSystemFields<Texpand>;
export type ReservationsResponse<Texpand = unknown> = Required<ReservationsRecord> &
	BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	apartments: ApartmentsRecord;
	content: ContentRecord;
	reservations: ReservationsRecord;
	users: UsersRecord;
};

export type CollectionResponses = {
	apartments: ApartmentsResponse;
	content: ContentResponse;
	reservations: ReservationsResponse;
	users: UsersResponse;
};

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'apartments'): RecordService<ApartmentsResponse>;
	collection(idOrName: 'content'): RecordService<ContentResponse>;
	collection(idOrName: 'reservations'): RecordService<ReservationsResponse>;
	collection(idOrName: 'users'): RecordService<UsersResponse>;
};
