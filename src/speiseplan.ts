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

export type SpeiseplanLocation = {
    speiseplanAdvanced: SpeiseplanAdvanced;
    speiseplanGerichtData: SpeiseplanGerichtData[];
};

export type ResponseData = {
    success: boolean;
    content: SpeiseplanLocation[];
};