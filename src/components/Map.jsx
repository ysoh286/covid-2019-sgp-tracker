import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip.jsx";
import { getClusterLocations, checkDischarge } from "../helpers/getData";

const geoJSON = require("../data/national-map-polygon-geojson.json");

const WIDTH = 700;
const HEIGHT = 450;

export const COLOURS = {
    discharged: "#37db63",
    treated: "#ff3b3b",
    dead: "black",
};

// get points of stay -
const getPoints = (data) => {
    const points = data.map(d => {
        const [lat, long] = d.posLocationCoord;
        const isDischarged = checkDischarge(d, data[data.length - 1].confirmedDate);
        return {
            caseNumber: d.CASE_NUMBER,
            gender: d.GENDER,
            age: d.AGE,
            nationality: d.NATIONALITY,
            clusterGroup: d.CLUSTER_LOCATION_NAME,
            status:  isDischarged ? 
            "Discharged" : "In treatment",
            key: d.CASE_NUMBER,
            name: d.PLACE_OF_STAY ? d.PLACE_OF_STAY : "Unknown",
            lat,
            long,
            colour: isDischarged ? COLOURS.discharged : COLOURS.treated,
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
        onMouseOver={() => setTooltip(p)}
        onMouseOut={() => setTooltip(false)} />);

    // for annotating points of cluster location
    const clusterData = getClusterLocations(data);
    const clusters = getCluster(clusterData);
    const clusterPoints = clusters.map(c => <path  d="
    M 0.000 3.000
    L 2.939 4.045
    L 2.853 0.927
    L 4.755 -1.545
    L 1.763 -2.427
    L 0.000 -5.000
    L -1.763 -2.427
    L -4.755 -1.545
    L -2.853 0.927
    L -2.939 4.045
    L 0.000 3.000
    "
    transform={`translate(${projection([c.long, c.lat])[0] || 10}, 
    ${projection([c.long, c.lat])[1] || 10})`}
    className={"clusterPoint"}
    key={c.key}
    fill={"none"} stroke={"purple"} opacity={0} />);

    // update circles when data changes


    // when it updates, do the transition
    useEffect(() => {
        const transitionPoints = () => {
            d3.select(mapRef.current)
                .selectAll("circle")
                .data(getPoints(data))
                .attr("cx", d => projection([d.long, d.lat])[0] + Math.random() * 3 || 10)
                .attr("cy", d => projection([d.long, d.lat])[1] + Math.random() * 3 || 10)
                .transition()
                .duration(1000)
                .attr("r", 3);

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
            <Tooltip x={projection([tooltip.long, tooltip.lat])[0] || 10}
                y={projection([tooltip.long, tooltip.lat])[1] || 10} info={tooltip} />
        </svg>
    );

};

export default Map;