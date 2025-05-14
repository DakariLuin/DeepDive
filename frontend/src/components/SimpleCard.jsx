import React from 'react';
import './SimpleCard.css'
function SimpleCardPage(props) {
    return (
        <div className="container">
            <h1 className="shadow">Deep Dive</h1>
            <div className="card">
                <h2>{props.cardTitle}</h2>
                {props.children}
            </div>
        </div>
    );
}

export default SimpleCardPage;