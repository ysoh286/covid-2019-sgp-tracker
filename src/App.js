import React, { useEffect, useState } from 'react';
import './App.css';
import Map from "./components/Map";

import * as d3 from "d3";
import csvData from "./data/ncovid-2019-sgp.csv";
import { processData, getNumberOfCases, getNumberOfDischarged } from "./data/getData";
import NationalityTally from './components/NationalityTally';
import LoadingWrapper from "./components/LoadingWrapper";

// const title = "nCovid-19 - Singapore";

const App = () => {

  const [data, setData] = useState([]);

  // component did mount 
  useEffect(() => {
    d3.csv(csvData).then(d => {
      setData(processData(d));
    });
  }, []);

  if (data.length === 0) return <div className={"AppContainer"}>LOADING...</div>;

  const discharged = getNumberOfDischarged(data);
  const cases = getNumberOfCases(data);

  return (
    <div className="AppContainer">
      <div className="overlay">
        <div className={"container"}>
          <LoadingWrapper loading={data.length === 0}>
            <div className="header">
              {/* <h2>{title}</h2> */}
            </div>
            <div className={"content"}>
              <Map data={data} />
            </div>
            <div className={"right"}>
              <h2 className={"date"}>{data[data.length - 1].CONFIRMED_DATE}</h2>
              <h3 className={"cases"}>Cases: {cases}</h3>
              <h3 className={"treatment"}>In treatment: {cases - discharged}</h3>
              <h3 className={"discharged"}>Discharged: {discharged}</h3>
              <h3 className="deaths">Deaths: 0</h3>

              <NationalityTally data={data} />
            </div>
            <div className={"footer"}>
              This is still under construction. Sources come from Wikipedia, background picture comes from
          <a href="https://www.newscientist.com/article/2231453-new-coronavirus-may-be-much-more-contagious-than-initially-thought">
                New Scientist
          </a>
            </div>
          </LoadingWrapper>
        </div>
      </div>
    </div>
  );

}

export default App;
