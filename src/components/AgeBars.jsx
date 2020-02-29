import React from "react";
import { groupDataByAge } from "../helpers/getData";

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
                {dataByAge.map(d => <div className="ageBar" key={d.label}
                    style={{ width: `${d.count / max * 100}%` }} />)}
            </div>
        </div>
    );




};

export default AgeBars;