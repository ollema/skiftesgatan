export type User = {
	id: string;
	name: string;
	email: string;
	role: 'board' | 'member';
};

export type Apartment = {
	id: string;
	apartment: string;
	owners?: User[];
	subtenants?: User[];
};
