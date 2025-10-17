import React from 'react';
import { SearchIcon } from './IconComponents';

interface GraphControlsProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

const GraphControls: React.FC<GraphControlsProps> = ({ searchQuery, onSearchQueryChange }) => {
    return (
        <div className="graph-controls">
            <div className="relative">
                <SearchIcon className="graph-search-icon h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search map..."
                    className="graph-search-input"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default GraphControls;
