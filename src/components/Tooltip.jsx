import React from "react";

const Tooltip = ({ x, y, info }) => {
    if (!info) return null;
    return (
        <foreignObject x={x} y={y + 40} width="100" height="500">
            <div className={"tooltip"}>
                <p className={"tooltip_text"}>Case number: <b>{info.caseNumber}</b></p>
                <p className={"tooltip_text"}>Gender: <b>{info.gender}</b></p>
                <p className={"tooltip_text"}>Status: <b>{info.status}</b></p>
                <p className={"tooltip_text"}>Place of stay: <b>{info.name}</b></p>
                <p className={"tooltip_text"}>Cluster relation: <b>{info.clusterGroup}</b></p>
            </div>
        </foreignObject>
    );
};

export default Tooltip;