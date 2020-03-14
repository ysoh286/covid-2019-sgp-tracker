import React, { useEffect, useState, useCallback } from 'react';
import { throttle } from "lodash";
import { DateTime } from "luxon";
import './App.css';
import Map from "./components/Map";

import * as d3 from "d3";
import csvData from "./data/covid-2019-automated.csv";
import { processData, getNumberOfCases, getNumberOfDischarged, getDatesAndDuration } from "./helpers/getData";
import NationalityTally from './components/NationalityTally';
import LoadingWrapper from "./components/LoadingWrapper";
import AgeBars from './components/AgeBars';

const title = "COVID-2019 - SGP";

const App = () => {

  // const [progress, reset] = useAnimation(1000);
  // const [anim, setAnim] = useState(false);
  // const [startTime, setStartTime] = useState(Date.now());

  // set data to render
  const [data, setData] = useState([]);
  // set date to show (cumulative)
  const [date, setDate] = useState(DateTime.local().toMillis());

  const setDelayedQueryDate = useCallback(throttle(value => setDate(value), 500), []);

  // component did mount 
  useEffect(() => {
    d3.csv(csvData).then(d => {
      setData(processData(d));
    });
  }, []);

  const { firstDate, lastDate, days,
    // milliseconds 
  } = getDatesAndDuration(data);

  // useEffect(() => {
  //   let queuedFrame;
  //   const frame = () => {
  //     const now = Date.now() - startTime;
  //     // if the dates is less than the last date, then keep moving forward
  //     if (now <= milliseconds && anim) {
  //       queuedFrame = requestAnimationFrame(frame);
  //     }
  //     console.log("now", now);
  //     setDate(parseInt(date) + now * 50000);

  //     if (date + now * 50000 >= lastDate) {
  //       cancelAnimationFrame(queuedFrame);
  //       setAnim(false);
  //     }
  //     // setAnim(now < milliseconds);
  //   };
  //   frame();

  //   return () => cancelAnimationFrame(queuedFrame);
  // }, [anim]);

  // const onPlay = () => {
  //   if (date >= lastDate) {
  //     setDate(firstDate);

  //   }
  //   setStartTime(Date.now());
  //   // start animation
  //   setAnim(!anim);
  // }

  // const reset = () => setAnim(false);

  if (data.length === 0) return <div className={"AppContainer"}>LOADING...</div>;

  // filter data by latest date
  const filteredData = data.filter(d => DateTime.fromISO(d.confirmedDate).toMillis() <= date);

  const discharged = getNumberOfDischarged(filteredData);
  const cases = getNumberOfCases(filteredData);

  // change slider
  const onChangeSlider = (e) => {
    const { value } = e.target;
    setDelayedQueryDate(value);
  }

  return (
    <div className="AppContainer">
      <div className="overlay">
        <div className={"container"}>
          <LoadingWrapper loading={data.length === 0}>
            <div className="header">
              <h2>{title}</h2>
            </div>
            <div className={"content"}>
              <Map data={filteredData} />
              <div className="dateSliderGroup">
                <input className={"dateSlider"}
                  type="range"
                  onChange={onChangeSlider}
                  min={firstDate}
                  max={lastDate}
                  value={date} />
                <div className={"dateSliderTicks"} style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}>
                  {
                    [...new Array(days)].map((d, i) => <div key={`day_${i}`} className={"dayTicks"}>
                    </div>)
                  }
                </div>
              </div>
              {/* <div className="playButton" onClick={onPlay}>
                &#9654;
              </div> */}
            </div>
            <div className={"right"}>
              <div className="caseText">
                <h2 className={"date"}>{DateTime.fromISO(filteredData[filteredData.length - 1].confirmedDate).toFormat("dd MMM yy")}</h2>
                <h3 className={"cases"}>Cases: {cases}</h3>
                <h3 className={"treatment"}>In treatment: {cases - discharged}</h3>
                <h3 className={"discharged"}>Discharged: {discharged}</h3>
                <h3 className="deaths">Deaths: 0</h3>
              </div>
              <NationalityTally data={filteredData} />
              <AgeBars data={filteredData} />
            </div>
            <div className={"footer"}>
              <div>
                Points on the map are rough estimates of locations and may not be exact. <br />
                Points that do not have a place of stay / or unknown are located on the top left.
              </div>
              This is still under construction / a work in progress.
              Created by a concerned human.
              Sources come from Wikipedia, background picture comes from
          <a href="https://www.newscientist.com/article/2231453-new-coronavirus-may-be-much-more-contagious-than-initially-thought">
                New Scientist.
          </a>
              Map created using geoJSON from Data.gov.sg.
            </div>
          </LoadingWrapper>
        </div>
      </div>
    </div>
  );

}

export default App;
