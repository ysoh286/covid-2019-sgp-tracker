import React from "react";
import { groupDataByAge } from "../helpers/getData";
import { COLOURS } from "./Map";

// ages bars that show which ones
const AgeBars = ({ data }) => {

    // sort data into age groups 
    const { dataByAge, max } = groupDataByAge(data);

    return (
        <div className="ageBarChart">
            <div className="ageBarChart__label">
                {dataByAge.map(d => <div key={`${d.label}_label`}>{d.label}</div>)}
            </div>
            <div>
                {dataByAge.map(d =>
                    <div key={d.label} className="barGroup">
                        <div className="ageBar " key={d.label}
                            style={{
                                width: `${d.treatmentSplit.treatment / max * 100}%`,
                                backgroundColor: COLOURS.treated
                            }} />
                        <div className={"ageBar discharged"} style={{
                            width: `${d.treatmentSplit.discharged / max * 100}%`,
                            backgroundColor: COLOURS.discharged
                        }} />
                    </div>)}
            </div>
        </div>
    );




};

export default AgeBars;