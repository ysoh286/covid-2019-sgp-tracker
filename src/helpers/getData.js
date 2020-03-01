import { DateTime } from "luxon";
import { maxBy } from "lodash";

const processData = (rawData) => {
    const processedData = rawData.map(d => {
        return {
            ...d,
            caseNumber: parseInt(d.CASE_NUMBER),
            confirmedDate: DateTime.fromFormat(d.CONFIRMED_DATE, "d-MMM-yy").toISODate(),
            dischargeDate: DateTime.fromFormat(d.DISCHARGE_DATE, "d-MMM-yy").toISODate(),
            age: parseInt(d.AGE),
            posLocationCoord: splitCoordinates(d.POS_LOCATION_COORD),
        };
    });

    return processedData;
}

// split geolocation coordinates as string into arr of numbers
const splitCoordinates = (coordinates) => {
    const coordArr = coordinates.split(",")
        .map(l => l ? parseFloat(l) : undefined);
    return coordArr;
};

// get number of confirmed cases reported
const getNumberOfCases = (data) => data.length;

// get number of cases discharged / recovered
const getNumberOfDischarged = (data) => {
    const latest = data[data.length - 1].confirmedDate;
    return data.filter(d => checkDischarge(d, latest)).length;
}

// get the breakdown by nationality
const getNationalitySummary = (data) => {
    const allNationalities = [...new Set(data.map(d => d.NATIONALITY))];

    return allNationalities.map(n => {
        const count = data.filter(d => d.NATIONALITY === n).length;
        return { nationality: n, key: n, count, countryCode: getCountryCode(n) };
    });
};

// unique cluster locations 
const getClusterLocations = (data) => {
    const uniqueLocationID = [...new Set(data.map(d => d.CLUSTER_LOCATION_ID))];
    // drop the first as it's undefined
    uniqueLocationID.shift();

    return uniqueLocationID.map(l => {
        const singleCase = data.filter(d => d.CLUSTER_LOCATION_ID === l)[0];
        const caseCount = data.filter(d => d.CLUSTER_LOCATION_ID === l).length;
        const { CLUSTER_LOCATION_NAME,
            CLUSTER_LOCATION_ID,
            CLUSTER_LOCATION_COORD } = singleCase;
        return {
            name: CLUSTER_LOCATION_NAME,
            id: CLUSTER_LOCATION_ID,
            caseCount,
            clusterCoord: splitCoordinates(CLUSTER_LOCATION_COORD),
        };
    })
};

const checkDischarge = (patient, currentDate = DateTime.local().toISO()) => {
    const { dischargeDate } = patient;
    const hasDischarge = DateTime.fromISO(dischargeDate).isValid;
    if (!hasDischarge) return false;
    // check current date
    if (DateTime.fromISO(dischargeDate).toMillis() <=
        DateTime.fromISO(currentDate).toMillis()) return true;
    return false;
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
        case "Philippines":
            return "ph";
        default:
            return "sg";
    }
}

// calcualte number of days from patient zero
const getDatesAndDuration = (data) => {

    if (data.length === 0) return { days: 1, milliseconds: 10000, firstDate: null, lastDate: null };
    const firstDate = DateTime.fromISO(data[0].confirmedDate);
    const lastDate = DateTime.fromISO(data[data.length - 1].confirmedDate);

    const { days } = lastDate.diff(firstDate, "days").toObject();
    const { milliseconds } = lastDate.diff(firstDate, "milliseconds").toObject();
    return {
        days,
        milliseconds,
        firstDate: firstDate.toMillis(),
        lastDate: lastDate.toMillis(),

    };
};

const groupDataByAge = (data) => {
    const AGE_GROUP_BRACKETS = [
        {
            label: "80 +",
            min: 80,
            max: 100
        },
        {
            label: "70 - 79",
            min: 70,
            max: 79
        },
        {
            label: "60 - 69",
            min: 60,
            max: 69,
        },
        {
            label: "50 - 59",
            min: 50,
            max: 59,
        },
        {
            label: "40 - 49",
            min: 40,
            max: 49,
        },
        {
            label: "30 - 39",
            min: 30,
            max: 39,
        },
        {
            label: "20 - 29",
            min: 20,
            max: 29,
        },
        {
            label: "0 - 19",
            min: 0,
            max: 19
        },
    ];

    const dataByAge = AGE_GROUP_BRACKETS.map(ageGroup => {
        const { min, max } = ageGroup;
        const dataInGroup = data.filter(d => d.age >= min && d.age <= max);
        const latestDate = data[data.length - 1].confirmedDate;
        return {
            ...ageGroup,
            count: dataInGroup.length,
            genderSplit: {
                female: dataInGroup.filter(d => d.GENDER === "Female"),
                male: dataInGroup.filter(d => d.GENDER === "Male"),
                other: dataInGroup.filter(d => d.GENDER !== "Female" && d.GENDER !== "Male"),
            },
            treatmentSplit: {
                discharged: dataInGroup.filter(d => checkDischarge(d, latestDate)).length,
                treatment: dataInGroup.filter(d => !checkDischarge(d, latestDate)).length,
            },
        };
    });

    // return max out of all the groups for calculating widths
    const { count } = maxBy(dataByAge, "count");
    return { max: count, dataByAge };
}

export {
    processData,
    getNumberOfCases,
    getNumberOfDischarged,
    checkDischarge,

    getNationalitySummary,

    getClusterLocations,

    getDatesAndDuration,

    groupDataByAge,
};

