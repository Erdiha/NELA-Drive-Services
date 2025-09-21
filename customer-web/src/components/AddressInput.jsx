import React, { useState, useEffect } from "react";

function AddressInput({ placeholder, onAddressSelect, icon }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length > 3) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        searchAddresses(query);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [query]);

  const searchAddresses = async (searchQuery) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&countrycodes=us`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (place) => {
    setQuery(place.display_name);
    setSuggestions([]); // Clear suggestions immediately
    setShowSuggestions(false); // Hide dropdown

    onAddressSelect({
      address: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    });
  };

  const handleInputBlur = () => {
    // Hide suggestions after a short delay to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
          {icon}
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={handleInputBlur}
          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl 
                     focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                     transition-all duration-200 text-gray-800 placeholder-gray-500 
                     text-lg outline-none hover:border-gray-300"
        />

        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {suggestions.map((place, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
              onMouseDown={() => handleSelectAddress(place)}
            >
              <div className="flex items-center">
                <div className="text-gray-400 mr-3">📍</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  {place.display_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressInput;
