import React, { useEffect, useRef } from "react";

export const WC = (props) => {
    const elRef = useRef(null);

    const handleEvent = (evt) => {
        const propName = `on${evt.type[0].toUpperCase()}${evt.type.slice(1)}`;

        if (props[propName]) {
            props[propName].call(evt.target, evt);
        }
    };

    useEffect(() => {
        const el = elRef.current;

        const events = Object.keys(props)
            .filter((key) => key.startsWith("on"))
            .map((key) => key.slice(2).toLocaleLowerCase());

        for (const event of events) {
            el.addEventListener(event, handleEvent);
        }

        return () => {
            for (const event of events) {
                el.removeEventListener(event, handleEvent);
            }
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={elRef} {...props}>
            {props.children}
        </div>
    );
};
