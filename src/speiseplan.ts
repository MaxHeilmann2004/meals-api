const KOCHWERK_BASE = 'https://kochwerk-web.webspeiseplan.de';
const KOCHWERK_MAIN_JS = `${KOCHWERK_BASE}/index.js`;
const KOCHWERK_TOKEN_REGEX = /PROXY_TOKEN:"([A-Za-z0-9]+)"/;
const KOCHWERK_API = 'https://kochwerk-web.webspeiseplan.de/index.php';
const KOCHWERK_MEALS_ENDPOINT = 'https://kochwerk-web.webspeiseplan.de/index.php?model=menu&location=1800&languagetype=1';
const KOCHWERK_REFERER = `${KOCHWERK_BASE}/menu`;
const KOCHWERK_LOCATION = 1800;
const KOCHWERK_LANG_DE = 1;

function buildApiUrl(model: 'menu' | 'features' | 'allergens' | 'additives', token: string) {
	const params = new URLSearchParams();
	params.set('model', model);
	params.set('location', KOCHWERK_LOCATION.toString());
	params.set('languagetype', KOCHWERK_LANG_DE.toString());
	params.set('token', token);
	params.set('_', Date.now().toString());
	return new URL(KOCHWERK_API);
}

export async function getKochwerkToken() {
	const req = await fetch(KOCHWERK_MAIN_JS);
	const body = await req.text();
	const match = body.match(KOCHWERK_TOKEN_REGEX);
	if (match == null) throw new Error('Could not extract token');
	if (match[1] == null) throw new Error('Could not extract token');
	return match[1];
}

export async function getMenu(): Promise<MealResponseData> {
	const req = await fetch(buildApiUrl('menu', await getKochwerkToken()), {
		headers: { Referer: KOCHWERK_REFERER },
	});
	return await req.json();
}

export async function getAllFeatures(): Promise<FeaturesResponseData> {
	const req = await fetch(buildApiUrl('features', await getKochwerkToken()), {
		headers: { Referer: KOCHWERK_REFERER },
	});
	return await req.json();
}

export async function getAllAllergens(): Promise<AllergensResponseData> {
	const req = await fetch(buildApiUrl('allergens', await getKochwerkToken()), {
		headers: { Referer: KOCHWERK_REFERER },
	});
	return await req.json();
}

export async function getAllAdditives(): Promise<AdditivesResponseData> {
	const req = await fetch(buildApiUrl('allergens', await getKochwerkToken()), {
		headers: { Referer: KOCHWERK_REFERER },
	});
	return req.json();
}

export type Sustainability = {
	co2: CO2 | null;
	nutriscore: number | null;
	trafficLight: number | null;
};

export type CO2 = {
	id: number;
	co2Value: number;
	co2RatingIdentifier: string;
};

export type Zusatzinformationen = {
	id: number;
	gerichtnameAlternative: string;
	mitarbeiterpreisDecimal2: number;
	gaestepreisDecimal2: number | null;
	ernaehrungsampelID: number | null;
	nwkjInteger: number;
	nwkcalInteger: number;
	nwfettDecimal1: number;
	nwfettsaeurenDecimal1: number;
	nwkohlehydrateDecimal1: number;
	nwzuckerDecimal1: number;
	nweiweissDecimal1: number;
	nwsalzDecimal1: number;
	nwbeDecimal2: number | null;
	allowFeedback: boolean | null;
	gerichtImage: string;
	lieferanteninfo: string | null;
	lieferanteninfoLink: string | null;
	edFaktorDecimal1: number | null;
	plu: string;
	price3Decimal2: number | null;
	price4Decimal2: number | null;
	contingent: number | null;
	taxRateDecimal2: number | null;
	ingredientList: string | null;
	sustainability: Sustainability;
};

export type SpeiseplanAdvancedGericht = {
	id: number;
	aktiv: boolean;
	datum: string; // ISO date string
	gerichtkategorieID: number;
	reihenfolgeInGerichtkategorie: number;
	gerichtname: string;
	zusatzinformationenID: number;
	speiseplanAdvancedID: number;
	timestampLog: string; // ISO date string
	benutzerID: number;
};

export type SpeiseplanGerichtData = {
	speiseplanAdvancedGericht: SpeiseplanAdvancedGericht;
	zusatzinformationen: Zusatzinformationen;
	allergeneIds: string;
	zusatzstoffeIds: string | null;
	gerichtmerkmaleIds: string;
};

export type SpeiseplanAdvanced = {
	id: number;
	aktiv: boolean;
	gueltigTaeglich: boolean;
	showWeekend: boolean;
	exportInactiveContent: boolean;
	titel: string;
	anzeigename: string;
	gueltigVon: string; // ISO date string
	gueltigBis: string; // ISO date string
	reihenfolgeInApp: number;
	speiseplanLayoutTypeID: number | null;
	vendingMachineID: number | null;
	orderConfigurationID: number | null;
	pickupTimeID: number | null;
	outletID: number;
	timestampLog: string; // ISO date string
	benutzerID: number;
	orderInfo: {
		orderAllowed: boolean;
		preOrderAllowed: boolean;
		instantOrderAllowed: boolean;
		shippingAllowed: boolean;
		deliveryAssortment: boolean;
		instantOrderMinimumOrderValue: number | null;
		preOrderMinimumOrderValue: number | null;
		shippingOrderMinimumOrderValue: number | null;
		shippingCostFlatrate: number | null;
		shippingCostThreshold: number | null;
		postalCodeVerification: boolean;
		reusableProvider: boolean;
		reusableProviderId: number | null;
		allowedOrderProcesses: unknown[]; // Replace with specific type if known
		scan2go: boolean;
	};
	locationInfo: {
		id: number;
		name: string;
	};
	holidayInfo: unknown[]; // Replace with specific type if known
	pickupTimeInfo: unknown[]; // Replace with specific type if known
};

export interface Additive {
	id: number;
	name: string;
	kuerzel: string;
	logoImage: null;
	beschreibung: null;
	zusatzstoffeID: number;
	languageTypeID: number;
	benutzerID: number;
	timestampLog: string;
}

export interface Allergen {
	id: number;
	name: string;
	kuerzel: string;
	logoImage: string | null;
	allergeneID: number;
	timestampLog: string;
}

export interface Feature {
	id: number;
	name: string;
	nameAlternative: string | null;
	kuerzel: string;
	logoImage: string | null;
	rgbColor: string | null;
	reihenfolgeInApp: number;
	showInSpeiseplanOverview: boolean;
	showNotInFilter: boolean;
	beschreibung: string | null;
	gerichtmerkmalID: number;
	languageTypeID: number;
	benutzerID: number;
	timestampLog: string;
}

export type SpeiseplanLocation = {
	speiseplanAdvanced: SpeiseplanAdvanced;
	speiseplanGerichtData: SpeiseplanGerichtData[];
};

export interface KochwerkResponse<T> {
	success: boolean;
	content: T;
}

export type MealResponseData = KochwerkResponse<SpeiseplanLocation[]>;

export type AdditivesResponseData = KochwerkResponse<Additive[]>;

export type AllergensResponseData = KochwerkResponse<Allergen[]>;

export type FeaturesResponseData = KochwerkResponse<Feature[]>;
