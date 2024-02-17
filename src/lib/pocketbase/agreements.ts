import type { AgreementsResponse, TypedPocketBase } from '$lib/pocketbase-types';
import { Collections } from '$lib/pocketbase-types';

type ExpandedAgreementsResponse = AgreementsResponse<unknown> & { fileUrl: string };

export async function maybeGetAgreementsForApartment(
	pb: TypedPocketBase,
	apartment: string,
	fetchImplementation?: typeof fetch
) {
	const selectedFetchImplementation = fetchImplementation ? fetchImplementation : fetch;
	try {
		const agreements: ExpandedAgreementsResponse[] = await pb
			.collection(Collections.Agreements)
			.getFullList({
				filter: pb.filter('apartment.apartment = {:apartment}', { apartment: apartment }),
				fetch: selectedFetchImplementation
			});

		const token = await pb.files.getToken();

		for (const agreement of agreements) {
			const url = pb.getFileUrl(agreement, agreement.file, { token: token }) + '&download=1';
			agreement.fileUrl = url;
		}

		return agreements;
	} catch (e) {
		return [];
	}
}
