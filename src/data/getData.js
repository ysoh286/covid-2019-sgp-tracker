import { DateTime } from "luxon";


const processData = (rawData) => {
    const processedData = rawData.map(d => {
        return {
            ...d,
            caseNumber: parseInt(d.CASE_NUMBER),
            confirmedDate: DateTime.fromFormat(d.CONFIRMED_DATE, "d-MMM-yy").toISODate(),
            dischargeDate: DateTime.fromFormat(d.DISCHARGE_DATE, "d-MMM-yy").toISODate(),
            age: parseInt(d.AGE),
            posLocationCoord: d.POS_LOCATION_COORD.split(",").map(l => l ? parseFloat(l) : undefined),
        };
    });

    return processedData;
}

// get number of confirmed cases reported
const getNumberOfCases = (data) => data.length;

// get number of cases discharged / recovered
const getNumberOfDischarged = (data) => data.filter(d => d.DISCHARGE_DATE).length;

// get the breakdown by nationality
const getNationalitySummary = (data) => {
    const allNationalities = [...new Set(data.map(d => d.NATIONALITY))];

    return allNationalities.map(n => {
        const count = data.filter(d => d.NATIONALITY === n).length;
        return { nationality: n, key: n, count, countryCode: getCountryCode(n) };
    });
};

const getCountryCode = (country) => {
    switch (country) {
        case "Singapore":
            return "sg";
        case "Singapore PR":
            return "sg";
        case "Bangladesh":
            return "bd";
        case "China":
            return "cn";
        case "India":
            return "in";
        case "Malaysia":
            return "my";
        case "Indonesia":
            return "id";
        default:
            return "sg";
    }
}


export {
    processData,
    getNumberOfCases,
    getNumberOfDischarged,

    getNationalitySummary,
};

