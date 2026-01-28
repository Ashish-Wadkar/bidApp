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

interface TyreSectionProps {
  beadingCarId: string;
}

const { width, height } = Dimensions.get('window');

const TyreSection: React.FC<TyreSectionProps> = ({ beadingCarId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    sectionName: string;
    partName: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    RightSideFrontTyreImg: '',
    FrontRightSideTyreCondition: '',
    FrontRightSideTyreBrandYear: '',
    RightSideRearTyreImg: '',
    RearRightSideTyreCondition: '',
    RearRightSideTyreBrandYear: '',
    LeftSideRearTyreImg: '',
    RearLeftSideTyreCondition: '',
    RearLeftSideTyreBrandYear: '',
    LeftSideFrontTyreImg: '',
    FrontLeftSideTyreCondition: '',
    FrontLeftSideTyreBrandYear: '',
    SpareTyreCondition: '',
    SpareTyreBrandYear: '',
    SpareWheelImg: '',
    TyreRating: '',
  });

  const [uploadedImages, setUploadedImages] = useState({
    RightSideFrontTyreImg: null as string | null,
    RightSideRearTyreImg: null as string | null,
    LeftSideRearTyreImg: null as string | null,
    LeftSideFrontTyreImg: null as string | null,
    SpareWheelImg: null as string | null,
  });

  const fetchTyreData = async () => {
    setLoading(true);
    setError('');
    try {
      const docType = 'Tyre';
      const response = await fetch(
        `http://10.98.89.200:8086/uploadFileBidCar/getBidCarIdType?beadingCarId=${beadingCarId}&docType=${docType}`,
      );
      const text = await response.text();
      const data = JSON.parse(text);
      if (data?.object && Array.isArray(data.object)) {
        const formKeys = ['RightSideFrontTyreImg','FrontRightSideTyreCondition','FrontRightSideTyreBrandYear','RightSideRearTyreImg','RearRightSideTyreCondition','RearRightSideTyreBrandYear','LeftSideRearTyreImg','RearLeftSideTyreCondition','RearLeftSideTyreBrandYear','LeftSideFrontTyreImg','FrontLeftSideTyreCondition','FrontLeftSideTyreBrandYear','SpareTyreCondition','SpareTyreBrandYear','SpareWheelImg','TyreRating'];
        const imgKeys = ['RightSideFrontTyreImg','RightSideRearTyreImg','LeftSideRearTyreImg','LeftSideFrontTyreImg','SpareWheelImg'];
        data.object.forEach((item: any) => {
          const sub = item.subtype || '';
          if (sub && formKeys.includes(sub)) setFormData((prev) => ({ ...prev, [sub]: item.comment || '' }));
          if (item.documentLink && imgKeys.includes(sub)) setUploadedImages((prev) => ({ ...prev, [sub]: item.documentLink }));
        });
      }
    } catch {
      setError('Failed to load tyre data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beadingCarId) fetchTyreData();
  }, [beadingCarId]);

  const openImageModal = (imageUrl: string, partName: string) => {
    setSelectedImage({ uri: imageUrl, sectionName: 'Tyre', partName });
    setModalVisible(true);
  };

  const renderItem = (label: string, value: string, imageUrl: string | null) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {label}: {value || '-'}
      </Text>
      {imageUrl && (
        <TouchableOpacity onPress={() => openImageModal(imageUrl, label)} activeOpacity={0.8}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#262a4f" />
        <Text style={styles.loadingText}>Loading tyre data...</Text>
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
        <Text style={styles.mainTitle}>Tyre</Text>

        <View style={styles.card}>
          <View style={styles.gridContainer}>
            {renderItem('Front Right Tyre Condition', formData.FrontRightSideTyreCondition, uploadedImages.RightSideFrontTyreImg)}
            {renderItem('Front Right Tyre Brand & Year', formData.FrontRightSideTyreBrandYear, null)}
            {renderItem('Rear Right Tyre Condition', formData.RearRightSideTyreCondition, uploadedImages.RightSideRearTyreImg)}
            {renderItem('Rear Right Tyre Brand & Year', formData.RearRightSideTyreBrandYear, null)}
            {renderItem('Rear Left Tyre Condition', formData.RearLeftSideTyreCondition, uploadedImages.LeftSideRearTyreImg)}
            {renderItem('Rear Left Tyre Brand & Year', formData.RearLeftSideTyreBrandYear, null)}
            {renderItem('Front Left Tyre Condition', formData.FrontLeftSideTyreCondition, uploadedImages.LeftSideFrontTyreImg)}
            {renderItem('Front Left Tyre Brand & Year', formData.FrontLeftSideTyreBrandYear, null)}
            {renderItem('Spare Tyre Condition', formData.SpareTyreCondition, null)}
            {renderItem('Spare Tyre Brand & Year', formData.SpareTyreBrandYear, null)}
            {renderItem('Spare Wheel', '', uploadedImages.SpareWheelImg)}
            {renderItem('Tyre Rating', formData.TyreRating, null)}
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

export default TyreSection;
