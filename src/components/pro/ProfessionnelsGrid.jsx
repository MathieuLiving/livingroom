import React from 'react';
import DigitalBusinessCard from '../DigitalBusinessCard'; // Assuming DigitalBusinessCard is in ../ (components/DigitalBusinessCard.jsx)

const ProfessionnelsGrid = ({ professionnels }) => {
    if (!professionnels || professionnels.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">Aucun professionnel à afficher.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionnels.map(pro => (
                <div key={pro.id}>
                    <DigitalBusinessCard professionnel={pro} />
                </div>
            ))}
        </div>
    );
};

export default ProfessionnelsGrid;