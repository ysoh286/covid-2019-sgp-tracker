import React from "react";

const Tooltip = ({ x, y, info }) => {
    if (!info) return null;
    return (
        <foreignObject x={x} y={y + 40} width="100" height="500">
            <div className={"tooltip"}>
                {Object.keys(info).map(d => (d === "lat" || d === "long") ? null :
                    <p className={"tooltip_text"} key={d}>
                        {d.replace(/_/g, " ")}: <b>{info[d]}</b>
                    </p>)}
            </div>
        </foreignObject>
    );
};

export default Tooltip;