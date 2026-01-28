// components/HighestBidAmount.tsx
import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useWebSocket } from "../../utility/WebSocketConnection";

interface HighestBidAmountProps {
  bidCarId: string; // Updated to match your car ID naming
}

const HighestBidAmount: React.FC<HighestBidAmountProps> = ({ bidCarId }) => {
  const { isConnected, liveCars } = useWebSocket();
  const [highestBid, setHighestBid] = useState<number | null>(null);

  useEffect(() => {
    if (bidCarId && liveCars && liveCars.length > 0) {
      const matchingCar = liveCars.find(
        (car: any) => 
          String(car.id) === String(bidCarId) ||
          String(car.bidCarId) === String(bidCarId) ||
          String(car.carId) === String(bidCarId)
      );
      if (matchingCar && matchingCar.currentBid) {
        setHighestBid(matchingCar.currentBid);
      }
    }
  }, [bidCarId, liveCars]);

  return <Text>{highestBid ?? "-"}</Text>;
};

export default HighestBidAmount;
