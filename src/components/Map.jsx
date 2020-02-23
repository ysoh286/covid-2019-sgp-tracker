import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip.jsx";

const geoJSON = require("../data/national-map-polygon-geojson.json");

const WIDTH = 700;
const HEIGHT = 500;

const COLOURS = {
    discharged: "#42ff75",
    treated: "#ff3b3b",
    dead: "black",
};

// get points of stay -
const getPoints = (data) => {
    const points = data.map(d => {
        const posLocation = d.posLocationCoord;
        return {
            caseNumber: d.CASE_NUMBER,
            gender: d.GENDER,
            age: d.AGE,
            nationality: d.NATIONALITY,
            clusterGroup: d.CLUSTER_LOCATION_NAME,
            status: d.DISCHARGE_DATE ? "Discharged" : "In treatment",
            key: d.CASE_NUMBER,
            name: d.PLACE_OF_STAY ? d.PLACE_OF_STAY : "Unknown",
            lat: posLocation[0],
            long: posLocation[1],
            colour: d.DISCHARGE_DATE ? COLOURS.discharged : COLOURS.treated,
        };
    });
    return points;
}

// map of singapore
const Map = ({ data }) => {

    const [tooltip, setTooltip] = useState(false);
    const mapRef = useRef(null);

    const projection = d3.geoAlbers()
        .center([105, 1.3])
        .rotate([1.03, 0])
        .parallels([0, 5])
        .scale(70000);

    // for annotating points
    const points = getPoints(data);

    const geoGenerator = d3.geoPath()
        .projection(projection);

    const circles = points.map(p => <circle key={p.key}
        className={"circle"}
        cx={projection([p.long, p.lat])[0] || 10}
        cy={projection([p.long, p.lat])[1] || 10}
        fill={p.colour}
        onMouseOver={() => setTooltip(p)}
        onMouseOut={() => setTooltip(false)} />);

    // update circles when data changes


    // when it updates, do the transition
    useEffect(() => {
        const transitionPoints = () => {
            return d3.select(mapRef.current)
                .selectAll("circle")
                .data(getPoints(data))
                .attr("cx", d => projection([d.long, d.lat])[0] || 10)
                .attr("cy", d => projection([d.long, d.lat])[1] || 10)
                .transition()
                .duration(2000)
                .attr("r", 5);
        };
        transitionPoints();
    }, [data]);

    const mapPaths = geoJSON.features.map(d =>
        <path key={d.properties.Name} d={geoGenerator(d)} fill={"white"} stroke="none"></path>);

    return (
        <svg className={"sgp-map"} width={WIDTH} height={HEIGHT} ref={mapRef}>
            <g transform={"rotate(4.5) "}>
                {mapPaths}
                {circles}
            </g>
            <Tooltip x={projection([tooltip.long, tooltip.lat])[0] || 10}
                y={projection([tooltip.long, tooltip.lat])[1] || 10} info={tooltip} />
        </svg>
    );

};

export default Map;