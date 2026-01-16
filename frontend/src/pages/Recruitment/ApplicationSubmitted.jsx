import React from 'react';
import Navbar from '../../components/LandingPage/Navbar/NavbarComponent.jsx';
import Footer from '../../components/Footer/Footer';
import './Recruitment.css';

// Simple check icon
const CheckIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="success-icon"
    >
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

const ApplicationSubmitted = () => {
    return (
        <div className="submission-page">
            <Navbar />
            <div className="submission-content">
                <div className="submission-card">
                    <div className="success-icon-wrapper">
                        <CheckIcon />
                    </div>
                    <h2>Application Submitted!</h2>
                    <p>
                        Thank you for applying to our recruitment program. We'll review your application and get back to you within 5-7 business days.
                    </p>
                    <a href="/" className="btn-recruit-back">
                        Back to Recruitment
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ApplicationSubmitted;
