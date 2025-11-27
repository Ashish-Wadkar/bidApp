// WebSocketConnection.tsx - Socket.IO for React Native
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import io from 'socket.io-client';
type SocketType = SocketIOClient.Socket;
import AsyncStorage from '@react-native-async-storage/async-storage';

// -------- CONFIG --------
const WS_BASE_URL = 'http://10.37.206.200:8091'; // FIXED: Added : after http
const TOKEN_KEY = 'auth_token';
// ------------------------

type BidUserData = { userId: string; bidCarId: string; amount: number };

type WebSocketContextType = {
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionError: string | null;
  liveCars: any[];
  connectWebSocket: (authToken?: string) => Promise<void>;
  disconnectWebSocket: () => void;
  getLiveCars: () => Promise<boolean>;
  placeBid: (data: BidUserData) => Promise<any>;
  testConnection: () => void;
  debugWebSocket: () => void;
  retryConnection: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ========== STATE ==========
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [liveCars, setLiveCars] = useState<any[]>([]);

  // ========== REFS ==========
  const socketRef = useRef<SocketType | null>(null);
  const tokenRef = useRef<string | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectionRetryCountRef = useRef<number>(0);
  const MAX_RETRY_ATTEMPTS = 5;

  // ========== INITIALIZATION ==========
  useEffect(() => {
    initializeWebSocket();
    return () => {
      cleanupWebSocket();
    };
  }, []);

  const initializeWebSocket = async () => {
    await loadStoredToken();
    console.log('🎯 WebSocket Provider Initialized');
    console.log('🌐 WebSocket URL:', WS_BASE_URL);
  };

  const loadStoredToken = async () => {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        tokenRef.current = stored;
        console.log('✅ Loaded token from storage');
      } else {
        console.log('❌ No token found in storage');
      }
    } catch (e) {
      console.warn('Failed to read token from storage', e);
    }
  };

  const cleanupWebSocket = () => {
    console.log('🧹 Cleaning up WebSocket...');
    connectionAttemptRef.current = false;
    connectionRetryCountRef.current = 0;
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Disconnect socket
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      } catch (e) {
        console.warn('Error disconnecting socket:', e);
      }
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsAuthenticated(false);
    setConnectionStatus('disconnected');
  };

  // ========== CAR DATA TRANSFORMATION ==========
  const transformCars = (arr: any[]) => {
    if (!Array.isArray(arr)) {
      console.warn('⚠️ transformCars: Input is not an array', arr);
      return [];
    }
    
    console.log(`🔄 Transforming ${arr.length} cars`);
    
    return arr.map((car, index) => ({
      id: car.id || car.carId || car.bidCarId || `car-${Date.now()}-${index}`,
      imageUrl: car.imageUrl || car.image || car.carImage || '',
      city: car.city || 'Unknown',
      make: car.make || 'Car',
      model: car.model || 'Model',
      currentBid: car.currentBid || car.highestBid || 0,
      startingBid: car.startingBid || 0,
      closingTime: car.closingTime,
      ...car,
    }));
  };

  // ========== SETUP EVENT LISTENERS ==========
  const setupEventListeners = (socket: SocketType) => {
    console.log('📡 Setting up Socket.IO event listeners...');

    // Connection established
    socket.on('connect', () => {
      console.log('🎉 Socket.IO CONNECTED!');
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionError(null);
    });

    // Live Cars listener
    socket.on('liveCars', (data: any) => {
      console.log('📨 Received liveCars event');
      console.log('📊 Raw live cars data:', data);
      
      try {
        const dataArray = Array.isArray(data) ? data : [data];
        const transformed = transformCars(dataArray);
        console.log(`⚡ Successfully transformed ${transformed.length} live cars`);
        setLiveCars(transformed);
      } catch (error) {
        console.error('❌ Error processing live cars:', error);
        console.error('❌ Data that failed:', data);
      }
    });

    // Bids listener
    socket.on('bids', (data: any) => {
      console.log('💰 Received bid update:', data);
    });

    // Top bid listener
    socket.on('topBid', (data: any) => {
      console.log('🏆 Received top bid update:', data);
    });

    // Top bids listener
    socket.on('topBids', (data: any) => {
      console.log('🏆 Received top bids update:', data);
    });

    // Top three bids listener
    socket.on('topThreeBids', (data: any) => {
      console.log('📊 Received top three bids:', data);
    });

    // Place bid response listener
    socket.on('placeBidResponse', (data: any) => {
      console.log('✅ Received place bid response:', data);
    });

    // Error listener
    socket.on('error', (error: any) => {
      console.error('❌ Socket.IO error:', error);
      setConnectionError(error.message || 'Socket.IO error occurred');
      setConnectionStatus('error');
    });

    // Disconnect listener
    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 Socket.IO disconnected: ${reason}`);
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionStatus('disconnected');
      
      // Auto-reconnect if it was an unexpected disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect automatically
      } else {
        // Client-side disconnect or network error, attempt reconnect
        scheduleReconnection();
      }
    });

    // Reconnect listener
    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      connectionRetryCountRef.current = 0;
    });

    console.log('✅ All event listeners setup completed');
  };

  // ========== REQUEST LIVE CARS ==========
  const requestLiveCars = (): boolean => {
    if (!socketRef.current?.connected) {
      console.warn('❌ Cannot request live cars: Socket.IO not connected');
      return false;
    }

    try {
      socketRef.current.emit('liveCars', {
        requestId: Date.now(),
        timestamp: new Date().toISOString()
      });
      console.log('📨 Emitted liveCars request');
      return true;
    } catch (error) {
      console.error('❌ Failed to emit liveCars request:', error);
      return false;
    }
  };

  // ========== RECONNECTION LOGIC ==========
  const scheduleReconnection = () => {
    if (connectionRetryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      console.log('🚫 Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionRetryCountRef.current), 30000);
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${connectionRetryCountRef.current + 1}/${MAX_RETRY_ATTEMPTS})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectionRetryCountRef.current++;
      if (tokenRef.current) {
        connectWebSocket();
      }
    }, delay);
  };

  // ========== MAIN CONNECTION FUNCTION ==========
  const createAndConnectSocket = (token: string) => {
    if (connectionAttemptRef.current) {
      console.log('⏳ Connection attempt already in progress, skipping...');
      return;
    }

    connectionAttemptRef.current = true;
    setConnectionStatus('connecting');
    setConnectionError(null);

    console.log('🔌 Creating new Socket.IO client...');
    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    console.log('🌐 Connecting to:', WS_BASE_URL);
    
    try {
      // Create socket with authentication
      // Socket.IO v2.x compatible configuration
      const socket = io(WS_BASE_URL, {
        transports: ['websocket', 'polling'], // WebSocket first, polling as fallback
        // Note: 'auth' option is not available in v2.x, use query instead
        query: {
          token: token,
        },
        reconnection: false, // We'll handle reconnection manually
        timeout: 20000,
        forceNew: true, // Force new connection
        autoConnect: true, // Auto connect
      });

      socketRef.current = socket;

      // Setup all event listeners first
      setupEventListeners(socket);

      // Connection successful
      socket.on('connect', () => {
        console.log('🎉 Socket.IO CONNECTED SUCCESSFULLY!');
        console.log('Socket ID:', socket.id);
        
        connectionAttemptRef.current = false;
        connectionRetryCountRef.current = 0;
        setIsConnected(true);
        setIsAuthenticated(true);
        setConnectionStatus('connected');
        setConnectionError(null);

        // Request initial live cars data after a short delay
        setTimeout(() => {
          console.log('🚀 Requesting initial live cars data...');
          const success = requestLiveCars();
          if (!success) {
            console.warn('⚠️ Initial live cars request failed');
          }
        }, 500);
      });

      // Connection error
      socket.on('connect_error', (error: Error) => {
        console.error('❌ Socket.IO Connection Error:', error.message);
        console.error('❌ Error details:', error);
        console.error('❌ Connection URL:', WS_BASE_URL);
        console.error('❌ Socket ID:', socket.id);
        
        connectionAttemptRef.current = false;
        setConnectionError(error.message || 'Socket.IO connection failed');
        setConnectionStatus('error');
        
        // Schedule reconnection
        scheduleReconnection();
      });

      // Connect timeout
      socket.on('connect_timeout', () => {
        console.error('❌ Socket.IO Connection Timeout');
        
        connectionAttemptRef.current = false;
        setConnectionError('Connection timeout');
        setConnectionStatus('error');
        
        // Schedule reconnection
        scheduleReconnection();
      });

    } catch (error: any) {
      console.error('❌ Failed to create Socket.IO client:', error);
      connectionAttemptRef.current = false;
      setConnectionError('Failed to create Socket.IO client');
      setConnectionStatus('error');
      scheduleReconnection();
    }
  };

  // ========== PUBLIC API METHODS ==========
  const connectWebSocket = async (authToken?: string): Promise<void> => {
    console.log('🔗 connectWebSocket called');
    
    const tokenToUse = authToken || tokenRef.current;
    
    if (!tokenToUse) {
      console.error('❌ No token available for WebSocket connection');
      setConnectionError('No authentication token available');
      setConnectionStatus('error');
      return;
    }

    // Save token if it's new
    if (authToken && authToken !== tokenRef.current) {
      try {
        tokenRef.current = authToken;
        await AsyncStorage.setItem(TOKEN_KEY, authToken);
        console.log('💾 New auth token saved to storage');
      } catch (err) {
        console.warn('⚠️ Failed to save token:', err);
      }
    }

    // If already connected and authenticated, just return
    if (socketRef.current?.connected && isAuthenticated) {
      console.log('ℹ️ Already connected and authenticated, skipping...');
      return;
    }

    // If socket exists but not connected, cleanup first
    if (socketRef.current && !socketRef.current.connected) {
      console.log('🔄 Cleaning up previous disconnected socket...');
      cleanupWebSocket();
    }

    createAndConnectSocket(tokenToUse);
  };

  const disconnectWebSocket = () => {
    console.log('🔌 Manual disconnect called');
    cleanupWebSocket();
  };

  const getLiveCars = async (): Promise<boolean> => {
    console.log('🔄 Manual getLiveCars called');
    return requestLiveCars();
  };

  const placeBid = async (data: BidUserData): Promise<any> => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      throw new Error('Socket.IO client not connected');
    }

    const payload = {
      placedBidId: null,
      userId: data.userId,
      bidCarId: parseInt(data.bidCarId),
      amount: parseFloat(data.amount.toString()),
      dateTime: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      try {
        // Set up one-time listener for response
        const responseListener = (response: any) => {
          socket.off('placeBidResponse', responseListener);
          console.log('💰 Bid response received:', response);
          resolve(response);
        };

        socket.on('placeBidResponse', responseListener);

        // Emit the bid
        socket.emit('placeBid', payload);
        console.log('💰 Bid placed successfully:', payload);

        // Timeout after 10 seconds
        setTimeout(() => {
          socket.off('placeBidResponse', responseListener);
          reject(new Error('Bid placement timeout'));
        }, 10000);
      } catch (error: any) {
        console.error('❌ Failed to place bid:', error);
        reject(new Error('Failed to place bid: ' + error.message));
      }
    });
  };

  const testConnection = () => {
    console.log('🔍 === SOCKET.IO CONNECTION TEST ===');
    console.log('  - Connection Status:', connectionStatus);
    console.log('  - Is Connected:', isConnected);
    console.log('  - Is Authenticated:', isAuthenticated);
    console.log('  - Socket Connected:', socketRef.current?.connected);
    console.log('  - Socket ID:', socketRef.current?.id);
    console.log('  - Live Cars Count:', liveCars.length);
    console.log('  - Token Available:', !!tokenRef.current);
    console.log('  - Connection Attempt in Progress:', connectionAttemptRef.current);
    console.log('  - Retry Count:', connectionRetryCountRef.current);
    console.log('🔍 === TEST COMPLETE ===');

    if (!socketRef.current?.connected) {
      console.log('🔄 Not connected, attempting to connect...');
      connectWebSocket();
    } else {
      console.log('🔄 Testing by requesting live cars...');
      requestLiveCars();
    }
  };

  const debugWebSocket = () => {
    console.log('🐛 === SOCKET.IO DEBUG INFO ===');
    console.log('  - Socket Reference:', socketRef.current ? 'Exists' : 'Null');
    console.log('  - Socket Connected:', socketRef.current?.connected);
    console.log('  - Socket ID:', socketRef.current?.id);
    console.log('  - Connection Status:', connectionStatus);
    console.log('  - Token Length:', tokenRef.current?.length);
    console.log('  - Live Cars Sample:', liveCars.slice(0, 2));
    console.log('🐛 === DEBUG COMPLETE ===');
  };

  const retryConnection = () => {
    console.log('🔄 Manual retry called');
    connectionRetryCountRef.current = 0;
    if (tokenRef.current) {
      connectWebSocket();
    }
  };

  // ========== CONTEXT VALUE ==========
  const value: WebSocketContextType = {
    isConnected,
    isAuthenticated,
    connectionStatus,
    connectionError,
    liveCars,
    connectWebSocket,
    disconnectWebSocket,
    getLiveCars,
    placeBid,
    testConnection,
    debugWebSocket,
    retryConnection,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
};

// Export hook for easy usage
export default useWebSocket;