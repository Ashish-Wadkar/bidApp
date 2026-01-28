// components/LiveBid.tsx
import React, { useEffect } from "react";
import { View, FlatList } from "react-native";
import Card from "./cards";
import { useWebSocket } from "../../utility/WebSocketConnection";

interface LiveCar {
  bidCarId: string;
  beadingCarId: string;
  basePrice: number;
  closingTime: string;
  [key: string]: any;
}

const LiveBid: React.FC = () => {
  const { liveCars, getLiveCars, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      getLiveCars();
    }
  }, [isConnected]);

  // Transform liveCars to match Card component's expected format
  const transformedCars = liveCars.map((car: any) => ({
    bidCarId: String(car.id || car.bidCarId || car.carId || ''),
    beadingCarId: String(car.beadingCarId || car.id || ''),
    basePrice: car.currentBid || car.startingBid || 0,
    closingTime: car.closingTime || '',
    year: car.year || '',
    brand: car.make || car.brand || '',
    model: car.model || '',
    kmDriven: car.kmDriven || '',
    ownerSerial: car.ownerSerial || '',
    fuelType: car.fuelType || '',
    registration: car.registration || '',
    area: car.area || '',
    city: car.city || '',
    imageUrl: car.imageUrl || car.image || '',
    ...car,
  }));

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={transformedCars}
        keyExtractor={(item) => String(item.bidCarId || item.id || Math.random())}
        renderItem={({ item }) => <Card cardData={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
      />
    </View>
  );
};

export default LiveBid;
