import React from "react";

const styles = {
    img: { height: "75px", width: "75px" },
};

const Loader = () => {
    return <img style={styles.img} src="./assets/loader.gif" />;
};

export default Loader;
