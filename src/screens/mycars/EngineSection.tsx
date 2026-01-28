import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface EngineSectionProps {
  beadingCarId: string;
}

const { width, height } = Dimensions.get('window');

const EngineSection: React.FC<EngineSectionProps> = ({ beadingCarId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; sectionName: string; partName: string } | null>(null);

  const [formData, setFormData] = useState({
    Engine: "",
    EnginMounting: "",
    EngineSound: "",
    Exhaustsmoke: "",
    Gearbox: "",
    Engineoil: "",
    Battery: "",
    Coolant: "",
    Clutch: "",
  });

  const [uploadedImages, setUploadedImages] = useState({
    Engines: null as string | null,
    EngineMountings: null as string | null,
    EngineSounds: null as string | null,
    Exhaustsmokes: null as string | null,
    Gearboxs: null as string | null,
    Engineoils: null as string | null,
    Batterys: null as string | null,
    Coolants: null as string | null,
    Clutchs: null as string | null,
  });

  const fetchEngineData = async () => {
    setLoading(true);
    setError('');
    try {
      const docType = 'Engine';
      const response = await fetch(
        `http://10.98.89.200:8086/uploadFileBidCar/getBidCarIdType?beadingCarId=${beadingCarId}&docType=${docType}`
      );
      const text = await response.text();
      const data = JSON.parse(text);

      console.log('Engine Data:', data);

      if (data?.object && Array.isArray(data.object)) {
        data.object.forEach((item: any) => {
          switch (item.subtype) {
            case "Engine":
              setFormData((prev) => ({ ...prev, Engine: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Engines: item.documentLink }));
              break;
            case "EngineMounting":
              setFormData((prev) => ({ ...prev, EnginMounting: item.comment }));
              setUploadedImages((prev) => ({ ...prev, EngineMountings: item.documentLink }));
              break;
            case "EngineSound":
              setFormData((prev) => ({ ...prev, EngineSound: item.comment }));
              setUploadedImages((prev) => ({ ...prev, EngineSounds: item.documentLink }));
              break;
            case "Exhaustsmoke":
              setFormData((prev) => ({ ...prev, Exhaustsmoke: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Exhaustsmokes: item.documentLink }));
              break;
            case "Gearbox":
              setFormData((prev) => ({ ...prev, Gearbox: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Gearboxs: item.documentLink }));
              break;
            case "Engineoil":
              setFormData((prev) => ({ ...prev, Engineoil: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Engineoils: item.documentLink }));
              break;
            case "Battery":
              setFormData((prev) => ({ ...prev, Battery: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Batterys: item.documentLink }));
              break;
            case "Coolant":
              setFormData((prev) => ({ ...prev, Coolant: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Coolants: item.documentLink }));
              break;
            case "Clutch":
              setFormData((prev) => ({ ...prev, Clutch: item.comment }));
              setUploadedImages((prev) => ({ ...prev, Clutchs: item.documentLink }));
              break;
            default:
              break;
          }
        });
      }
    } catch (err) {
      console.error('Error fetching engine data:', err);
      setError('Failed to load engine data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beadingCarId) {
      fetchEngineData();
    }
  }, [beadingCarId]);

  const openImageModal = (imageUrl: string, partName: string) => {
    setSelectedImage({
      uri: imageUrl,
      sectionName: 'Engine',
      partName: partName,
    });
    setModalVisible(true);
  };

  const renderItem = (label: string, value: string, imageUrl: string | null) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{label}: {value || '-'}</Text>
      {imageUrl && (
        <TouchableOpacity onPress={() => openImageModal(imageUrl, label)} activeOpacity={0.8}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#262a4f" />
        <Text style={styles.loadingText}>Loading engine data...</Text>
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
        <Text style={styles.mainTitle}>Engine</Text>

        <View style={styles.card}>
          <View style={styles.gridContainer}>
            {renderItem("Engine", formData.Engine, uploadedImages.Engines)}
            {renderItem("Engin Mounting", formData.EnginMounting, uploadedImages.EngineMountings)}
            {renderItem("Engine Sound", formData.EngineSound, uploadedImages.EngineSounds)}
            {renderItem("Exhaust Smoke", formData.Exhaustsmoke, uploadedImages.Exhaustsmokes)}
            {renderItem("Gearbox", formData.Gearbox, uploadedImages.Gearboxs)}
            {renderItem("Engine Oil", formData.Engineoil, uploadedImages.Engineoils)}
            {renderItem("Battery", formData.Battery, uploadedImages.Batterys)}
            {renderItem("Coolant", formData.Coolant, uploadedImages.Coolants)}
            {renderItem("Clutch", formData.Clutch, uploadedImages.Clutchs)}
          </View>
        </View>
      </View>

      {/* Full Size Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalSectionName}>{selectedImage.sectionName}</Text>
                <Text style={styles.modalPartName}>{selectedImage.partName}</Text>
              </View>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
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
  gridContainer: {
    gap: 20,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 8,
    resizeMode: 'cover',
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalSectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalPartName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modalImage: {
    width: width,
    height: height,
  },
});

export default EngineSection;