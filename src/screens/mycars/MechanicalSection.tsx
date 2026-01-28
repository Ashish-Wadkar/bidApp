import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MechanicalSectionProps {
  beadingCarId: string;
}

const { width, height } = Dimensions.get('window');

const FIELDS = [
  'EngineMotorStatus',
  'EngineOil',
  'BrakesOil',
  'SteeringOil',
  'Coolant',
  'BrakesBooster',
  'Apron',
  'Chassis',
  'Brakes',
  'Suspension',
  'SuspensionBushing',
  'OilLeak',
  'SmokeColor',
  'ManualTransmissionFluidLevel',
  'DifferentialFluidLevel',
  'FluidLeakages',
  'SteeringGearboxLinkage',
  'DrivelineAxle',
  'EngineMotorNoise',
  'MechanicalRatings',
];

const LABELS: Record<string, string> = {
  EngineMotorStatus: 'Engine / Motor Status',
  EngineOil: 'Engine Oil',
  BrakesOil: 'Brakes Oil',
  SteeringOil: 'Steering Oil',
  Coolant: 'Coolant',
  BrakesBooster: 'Brakes Booster',
  Apron: 'Apron',
  Chassis: 'Chassis',
  Brakes: 'Brakes',
  Suspension: 'Suspension',
  SuspensionBushing: 'Suspension Bushing',
  OilLeak: 'Oil Leak',
  SmokeColor: 'Smoke Color',
  ManualTransmissionFluidLevel: 'Manual Transmission Fluid Level',
  DifferentialFluidLevel: 'Differential Fluid Level',
  FluidLeakages: 'Fluid Leakages',
  SteeringGearboxLinkage: 'Steering Gearbox & Linkage',
  DrivelineAxle: 'Driveline / Axle',
  EngineMotorNoise: 'Engine / Motor Noise',
  MechanicalRatings: 'Mechanical Ratings',
};

const MechanicalSection: React.FC<MechanicalSectionProps> = ({ beadingCarId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; sectionName: string; partName: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>(
    FIELDS.reduce((acc, k) => ({ ...acc, [k]: '' }), {}),
  );
  const [engineImg, setEngineImg] = useState<string | null>(null);

  const fetchMechanicalData = async () => {
    setLoading(true);
    setError('');
    try {
      const docType = 'Mechanical';
      const response = await fetch(
        `http://10.98.89.200:8086/uploadFileBidCar/getBidCarIdType?beadingCarId=${beadingCarId}&docType=${docType}`,
      );
      const text = await response.text();
      const data = JSON.parse(text);
      if (data?.object && Array.isArray(data.object)) {
        data.object.forEach((item: any) => {
          const sub = item.subtype || '';
          if (sub && FIELDS.includes(sub)) {
            setFormData((prev) => ({ ...prev, [sub]: item.comment || '' }));
          }
          if (sub === 'EngineMotorImg' && item.documentLink) setEngineImg(item.documentLink);
        });
      }
    } catch {
      setError('Failed to load mechanical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beadingCarId) fetchMechanicalData();
  }, [beadingCarId]);

  const openImageModal = (imageUrl: string, partName: string) => {
    setSelectedImage({ uri: imageUrl, sectionName: 'Mechanical', partName });
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#262a4f" />
        <Text style={styles.loadingText}>Loading mechanical data...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.mainTitle}>Mechanical</Text>

        <View style={styles.card}>
          <View style={styles.gridContainer}>
            {FIELDS.map((key) => (
              <View key={key} style={styles.itemContainer}>
                <Text style={styles.itemText}>
                  {LABELS[key] || key}: {formData[key] || '-'}
                </Text>
              </View>
            ))}

            {engineImg && (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>Engine / Motor Image</Text>
                <TouchableOpacity onPress={() => openImageModal(engineImg, 'Engine / Motor')} activeOpacity={0.8}>
                  <Image source={{ uri: engineImg }} style={styles.image} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalSectionName}>{selectedImage.sectionName}</Text>
                <Text style={styles.modalPartName}>{selectedImage.partName}</Text>
              </View>
              <Image source={{ uri: selectedImage.uri }} style={styles.modalImage} resizeMode="contain" />
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 14, color: '#374151' },
  errorText: { fontSize: 14, color: 'red', textAlign: 'center' },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 550,
  },
  gridContainer: { gap: 20 },
  itemContainer: { marginBottom: 16 },
  itemText: { fontSize: 14, color: '#374151', marginBottom: 8 },
  image: { width: 100, height: 100, marginTop: 8, resizeMode: 'cover', borderRadius: 4 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8 },
  modalHeader: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  modalSectionName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalPartName: { fontSize: 14, fontWeight: '500', color: '#fff' },
  modalImage: { width, height },
});

export default MechanicalSection;
