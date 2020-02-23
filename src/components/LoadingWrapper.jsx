import React from "react";

const LoadingWrapper = ({ loading, children }) => (loading ?
    <div className={"loadingContainer"}>LOADING...</div> : children);

export default LoadingWrapper;