import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

const RideMap = ({ pickup, dropoff, driverLocation }) => {
  if (!pickup || !dropoff) return null;

  // Calculate region to show all points
  const getRegion = () => {
    const lats = [pickup.latitude, dropoff.latitude];
    const lngs = [pickup.longitude, dropoff.longitude];

    if (driverLocation) {
      lats.push(driverLocation.latitude);
      lngs.push(driverLocation.longitude);
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          }}
          title="Pickup"
          pinColor="green"
        />

        {/* Dropoff Marker */}
        <Marker
          coordinate={{
            latitude: dropoff.latitude,
            longitude: dropoff.longitude,
          }}
          title="Dropoff"
          pinColor="red"
        />

        {/* Driver Location Marker */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="You"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default RideMap;
