import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip.jsx";
import { getClusterLocations, checkDischarge } from "../helpers/getData";

const geoJSON = require("../data/national-map-polygon-geojson.json");

const WIDTH = 575;
const HEIGHT = 500;

export const COLOURS = {
    discharged: "#37db63",
    treated: "#ff3b3b",
    dead: "black",
};

const STATUS_LABEL = {
    discharged: "Discharged",
    dead: "Passed away",
    treated: "In treatment",
};

const getStatus = (patient, data) => {

    const isDischarged = checkDischarge(patient, data[data.length - 1].confirmedDate);
    if (isDischarged) return "discharged";
    const isDead = patient.DEATH_DATE !== "NA";
    if (isDead) return "dead";
    return "treated";
};

// get points of stay -
const getPoints = (data) => {
    const points = data.map(d => {
        let [lat, long] = d.posLocationCoord;
        // if pos location is unknown, try cluster coordinates
        if (lat === "NA" && long === "NA") {
            lat = d.CLUSTER_LOCATION_LAT;
            long = d.CLUSTER_LOCATION_LONG;
        }
        const status = getStatus(d, data);
        return {
            caseNumber: d.CASE_NUMBER,
            gender: d.GENDER,
            age: d.AGE,
            nationality: d.NATIONALITY,
            clusterGroup: d.CLUSTER_LOCATION_NAME,
            status: STATUS_LABEL[status],
            key: d.CASE_NUMBER,
            name: d.PLACE_OF_STAY ? d.PLACE_OF_STAY : "Unknown",
            lat,
            long,
            colour: COLOURS[status],
        };
    });
    return points;
}

// get cluster
const getCluster = (clusterData) => {
    const clusterLocations = clusterData.map(d => {
        const [lat, long] = d.clusterCoord;
        return {
            ...d,
            key: d.id,
            lat,
            long,
            colour: "#423c6d",
        };
    });
    return clusterLocations;
};

// map of singapore
const Map = ({ data }) => {

    const [tooltip, setTooltip] = useState(false);
    const mapRef = useRef(null);

    // create projection + generator
    const projection = d3.geoAlbers()
        .center([105, 1.3])
        .rotate([1.03, 0])
        .parallels([0, 5])
        .scale(70000);

    const geoGenerator = d3.geoPath()
        .projection(projection);

    // for annotating points of place of stay for each case
    const points = getPoints(data);

    const circles = points.map(p => <circle key={p.key}
        className={"circle"}
        fill={p.colour}
        onMouseOver={() => setTooltip({
            case_number: p.caseNumber,
            gender: p.gender,
            status: p.status,
            place_of_stay: p.name,
            cluster_relation: p.clusterGroup,
            lat: p.lat,
            long: p.long,
        })}
        onMouseOut={() => setTooltip(false)} />);

    // for annotating points of cluster location
    const clusterData = getClusterLocations(data);
    const clusters = getCluster(clusterData);
    const clusterPoints = clusters.map(c => <path d="
    M 0.000 2.000
    L 2.351 3.236
    L 1.902 0.618
    L 3.804 -1.236
    L 1.176 -1.618
    L 0.000 -4.000
    L -1.176 -1.618
    L -3.804 -1.236
    L -1.902 0.618
    L -2.351 3.236
    L 0.000 2.000
    "
        transform={`translate(${projection([c.long, c.lat])[0] || 10}, 
    ${projection([c.long, c.lat])[1] || 10})`}
        className={"clusterPoint"}
        key={c.key}
        onMouseOver={() => setTooltip({
            cluster_name: c.name,
            number_of_related_cases: c.caseCount,
            lat: c.lat,
            long: c.long
        })}
        onMouseOut={() => setTooltip(false)}
        fill={"purple"} stroke={"indigo"} opacity={0} />);

    // update circles when data changes


    // when it updates, do the transition
    useEffect(() => {
        const transitionPoints = () => {
            d3.select(mapRef.current)
                .selectAll("circle")
                .data(getPoints(data))
                .attr("cx", d => projection([d.long, d.lat])[0] + Math.random() * 3 || 420 + Math.random() * 150)
                .attr("cy", d => projection([d.long, d.lat])[1] + Math.random() * 3 || 300 + Math.random() * 150)
                .transition()
                .duration(1000)
                .attr("r", 2.5);

            d3.select(mapRef.current)
                .selectAll(".clusterPoint")
                .data(clusters)
                .transition()
                .duration(1000)
                .attr("opacity", 1);
        };
        transitionPoints();
    }, [data]);

    const mapPaths = geoJSON.features.map(d =>
        <path key={d.properties.Name} d={geoGenerator(d)} fill={"white"} stroke="none"></path>);

    return (
        <svg className={"sgp-map"} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} ref={mapRef}>
            <g transform={"rotate(4.5) "}>
                {mapPaths}
                {circles}
                {clusterPoints}
            </g>
            <Tooltip x={projection([tooltip.long, tooltip.lat])[0] || 250}
                y={projection([tooltip.long, tooltip.lat])[1] || 300} info={tooltip} />
        </svg>
    );

};

export default Map;