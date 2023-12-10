export type User = {
	id: string;
	username: string;
	name: string;
	email: string;
};

export type Apartment = {
	id: string;
	apartment: string;
	owners?: User[];
	subtenants?: User[];
};
