import React, { useRef, useEffect } from 'react';// useRef - can be used to create so-called references which can be one of two things, we often use them to get a reference, a pointer at a real DOM node, that's one use case, a very prominent one, the other one is actually that with refs we could also create variables which survive re-render cycles of our components and don't lose their value}

import './Map.css';

const Map = props => {
    const mapRef = useRef();

    const {center, zoom} = props;

    //hook - that run only after jsx part of component is run, re-render element if dependencies change
    useEffect(() => {
        const map = new window.google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom
        });

        new window.google.maps.Marker({position: center, map: map});
    }, [center, zoom]);


    return <div ref={mapRef} className={`map ${props.className}`} style={props.style}></div>;
};

export default Map;