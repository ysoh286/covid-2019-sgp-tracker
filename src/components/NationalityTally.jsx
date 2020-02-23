import React from "react";
import { getNationalitySummary } from "../data/getData";

const NationalityTally = ({ data }) => {
    const summary = getNationalitySummary(data);
    console.log("summary", summary);

    return (
        <div className={"nationalityTallyContainer"}>
            {summary.map(s => <div className={"tallyItem"} key={s.key}>
                <img alt={s.countryCode}
                    src={`https://www.countryflags.io/${s.countryCode}/shiny/24.png`} />
                <div>{s.count}</div>
            </div>)}
        </div>
    )
};

export default NationalityTally;