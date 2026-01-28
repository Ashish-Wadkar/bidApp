import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import styles from '../account/AccountScreen.styles'; // Imported styles
 
const TOKEN_KEY = 'auth_token';
 
const AccountScreen = ({ navigation }: any) => {
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    mobileNo: '',
    shopName: '',
    area: '',
    city: '',
    address: '',
  });
  const [updateMessage, setUpdateMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
 
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
 
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT Parse Error:', error);
      return null;
    }
  };
 
  const fetchDealerData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert('Error', 'Missing authentication token.');
        setLoading(false);
        return;
      }
 
      const decoded = parseJwt(token);
      const dealerId = decoded?.dealerId;
      const userId = decoded?.userId;
      if (!dealerId || !userId) {
        Alert.alert('Error', 'User or Dealer ID not found.');
        setLoading(false);
        return;
      }
 
      const dealerRes = await fetch(
        `http://10.98.89.200:8086/dealer/${dealerId}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        },
      );
 
      const dealerJson = await dealerRes.json();
      if (dealerRes.ok && dealerJson?.dealerDto) setDealerData(dealerJson.dealerDto);
 
      const photoRes = await fetch(
        `http://10.98.89.200:8086/ProfilePhoto/getbyuserid?userId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
 
      if (photoRes.ok) {
        const blob = await photoRes.blob();
        const reader = new FileReader();
        reader.onload = () => {
          setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        setPhotoUrl(null);
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
      Alert.alert('Error', 'Unable to fetch dealer data.');
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAddImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;
      if (!userId) return Alert.alert('Error', 'User ID not found.');
 
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || !result.assets?.length) return;
 
      const file = result.assets[0];
      if (!file.uri) return Alert.alert('Error', 'Image URI not found.');
 
      const formData = new FormData();
      formData.append('image', {
        uri: file.uri,
        name: file.fileName || 'photo.jpg',
        type: file.type || 'image/jpeg',
      } as any);
 
      formData.append('userId', userId.toString());
 
      setLoading(true);
      const res = await fetch(
        'http://10.98.89.200:8086/ProfilePhoto/add',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
 
      if (res.ok) {
        Alert.alert('Success', 'Profile photo added successfully.');
        fetchDealerData();
      } else {
        const errorText = await res.text();
        console.error('Upload failed:', errorText);
        Alert.alert('Error', 'Failed to upload photo.');
      }
    } catch (error) {
      console.error('Add image error:', error);
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleDeleteImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;
      if (!userId) return Alert.alert('Error', 'User ID not found.');
 
      setLoading(true);
      const res = await fetch(
        `http://10.98.89.200:8086/ProfilePhoto/deletebyuserid?userId=${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
 
      if (res.ok) {
        setPhotoUrl(null);
        Alert.alert('Deleted', 'Profile photo removed successfully.');
        fetchDealerData();
      } else {
        const errorText = await res.text();
        console.error('Delete failed:', errorText);
        let msg = 'Failed to delete photo.';
        try {
          const err = JSON.parse(errorText);
          if (err.message?.includes('not found')) {
            setPhotoUrl(null);
            Alert.alert('Info', 'No profile photo to delete.');
            fetchDealerData();
            return;
          }
          msg = err.message || msg;
        } catch {}
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Delete image error:', error);
      Alert.alert('Error', 'Could not delete photo.');
    } finally {
      setLoading(false);
    }
  };
 
  const openModal = () => {
    if (dealerData) {
      setEditForm({
        firstName: dealerData.firstName || '',
        lastName: dealerData.lastName || '',
        mobileNo: dealerData.mobileNo || '',
        shopName: dealerData.shopName || '',
        area: dealerData.area || '',
        city: dealerData.city || '',
        address: dealerData.address || '',
      });
    }
    setUpdateMessage(null);
    setIsEditing(false);
    setModalVisible(true);
    Animated.timing(modalAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };
 
  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setModalVisible(false),
    );
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert('Error', 'Missing authentication token.');
        return;
      }

      const decoded = parseJwt(token);
      const userId = decoded?.userId;
      if (!userId) {
        Alert.alert('Error', 'User ID not found.');
        return;
      }

      setLoading(true);
      setUpdateMessage(null);

      const res = await fetch(
        `http://10.98.89.200:8086/dealer/updateDealer/${userId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            mobileNo: editForm.mobileNo.trim(),
            shopName: editForm.shopName.trim(),
            area: editForm.area.trim(),
            city: editForm.city.trim(),
            address: editForm.address.trim(),
          }),
        },
      );

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setUpdateMessage({
          type: 'success',
          text:
            data?.message ||
            'Your profile has been updated successfully. Thanks for keeping your details up to date.',
        });
        setIsEditing(false);
        // Refresh latest dealer data
        fetchDealerData();
      } else {
        setUpdateMessage({
          type: 'error',
          text:
            data?.message ||
            'We could not update your profile right now. Please review your details and try again.',
        });
      }
    } catch (error) {
      console.error('Update dealer error:', error);
      setUpdateMessage({
        type: 'error',
        text: 'Something went wrong while updating your profile. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };
 
  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            navigation.replace('Login');
          } catch {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };
 
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    fetchDealerData();
  }, []);
 
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo1.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
 
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.subTitle}>Manage your account</Text>
          </View>
 
          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
            <Image
              source={require('../../assets/images/image.png')}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
 
      {/* MAIN CONTENT */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>Get unlimited app access</Text>
          <Text style={styles.topBannerSub}>
            Buy <Text style={styles.highlight}>Basic</Text> at just ₹500 / month
          </Text>
          <TouchableOpacity style={{ marginTop: 8 }}>
            <Text style={styles.knowMore}>Know more</Text>
          </TouchableOpacity>
        </View> */}
 
        <TouchableOpacity activeOpacity={0.9} style={styles.profileCard} onPress={openModal}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.profileAvatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={64} color="#262A4F" />
          )}
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {dealerData
                ? `${dealerData.firstName} ${dealerData.lastName || ''}`
                : loading
                ? 'Loading...'
                : 'Name not available'}
            </Text>
            <Text style={styles.profileDetails}>
              {dealerData?.mobileNo || (loading ? 'Loading...' : 'Mobile not available')}
            </Text>
            <Text style={styles.profileDetails}>
              Shop: {dealerData?.shopName || (loading ? 'Loading...' : '—')}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#A9ACD6" />
        </TouchableOpacity>
 
        <View style={styles.twoCards}>
          <View style={styles.bigCard}>
            <Ionicons name="wallet-outline" size={34} color="#262A4F" />
            <Text style={styles.bigCardTitle}>Payment details</Text>
            <TouchableOpacity style={styles.rechargeBtn}>
              <Text style={styles.bigRechargeText}>₹0 | RECHARGE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.bigAccentLink}>Recharge more</Text>
            </TouchableOpacity>
          </View>
 
          <View style={styles.bigCard}>
            <Ionicons name="person-outline" size={34} color="#262A4F" />
            <Text style={styles.bigCardTitle}>Sales agent</Text>
            <Text style={styles.bigCardSub}>Organic Mumbai</Text>
            <TouchableOpacity style={{ marginTop: 'auto' }}>
              <Text style={styles.bigAccentLink}>Call agent</Text>
            </TouchableOpacity>
          </View>
        </View>
 
        <View style={styles.storyBanner}>
          <Text style={styles.storyText}>Your stories now have a new destination</Text>
          <Text style={styles.bigCardSub}>Follow Caryanamindia Partners</Text>
 
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => Linking.openURL('mailto:info@caryanamindia.in')}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => Linking.openURL('https://www.instagram.com/caryanamindia_/')}>
              <Ionicons name="logo-instagram" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() =>
                Linking.openURL('https://www.facebook.com/p/CaryanamIndia-61564972127778/')
              }>
              <Ionicons name="logo-facebook" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
 
   
        {/*
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Do not disturb</Text>
          <Switch
            value={doNotDisturb}
            onValueChange={setDoNotDisturb}
            thumbColor="#262A4F"
            trackColor={{ false: '#E5E7FF', true: '#61AFFE' }}
            ios_backgroundColor="#E5E7FF"
          />
        </View>
        */}
 
        <TouchableOpacity style={styles.rewardsCard}>
          <Ionicons name="gift-outline" size={28} color="#262A4F" />
          <Text style={styles.rewardsText}>My rewards</Text>
        </TouchableOpacity>
 
        <TouchableOpacity style={styles.logoutCard} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={28} color="#262A4F" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
 
      {/* MODAL */}
      <Modal visible={modalVisible} onRequestClose={closeModal} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <Animated.View
            style={[
              {
                flex: 1,
                backgroundColor: '#fff',
                opacity: modalAnim,
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}>
            {/* Header with close button */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: Platform.OS === 'ios' ? 50 : 20,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#262A4F' }}>Profile Details</Text>
              <TouchableOpacity onPress={closeModal} style={{ padding: 8 }}>
                <Ionicons name="close" size={28} color="#262A4F" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#262A4F" />
              </View>
            ) : dealerData ? (
              <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <View style={styles.profileImageContainer}>
                    {photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.profileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person-circle-outline" size={120} color="#ccc" />
                    )}
                    <View style={styles.imageButtonRow}>
                      <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                        <Text style={styles.addImageText}>ADD IMAGE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteImageButton} onPress={handleDeleteImage}>
                        <Text style={styles.deleteImageText}>DELETE IMAGE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {updateMessage && (
                    <View
                      style={{
                        backgroundColor: updateMessage.type === 'success' ? '#E3F9E5' : '#FEE2E2',
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <Ionicons
                        name={
                          updateMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'
                        }
                        size={20}
                        color={updateMessage.type === 'success' ? '#15803D' : '#B91C1C'}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: updateMessage.type === 'success' ? '#166534' : '#B91C1C',
                          fontWeight: '600',
                          flex: 1,
                        }}>
                        {updateMessage.text}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailBox}>
                    <EditableDetailRow
                      label="First Name"
                      value={editForm.firstName}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, firstName: text }))}
                    />
                    <EditableDetailRow
                      label="Last Name"
                      value={editForm.lastName}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, lastName: text }))}
                    />
                    <EditableDetailRow
                      label="Mobile Number"
                      value={editForm.mobileNo}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, mobileNo: text }))}
                    />
                    <EditableDetailRow
                      label="Shop Name"
                      value={editForm.shopName}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, shopName: text }))}
                    />
                    <EditableDetailRow
                      label="Area"
                      value={editForm.area}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, area: text }))}
                    />
                    {/* Email is intentionally non-editable as per requirements */}
                    <DetailRow label="Email" value={dealerData.email} />
                    <EditableDetailRow
                      label="City"
                      value={editForm.city}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, city: text }))}
                    />
                    <EditableDetailRow
                      label="Address"
                      value={editForm.address}
                      editable={isEditing}
                      onChangeText={text => setEditForm(prev => ({ ...prev, address: text }))}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.editButton, { marginTop: 16 }]}
                    onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}>
                    <Text style={styles.editButtonText}>
                      {isEditing ? 'SAVE CHANGES' : 'EDIT PROFILE'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>No data available.</Text>
                </View>
              )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
 
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#262A4F" />
        </View>
      )}
    </Animated.View>
  );
};
 
// FIXED: Address wraps to next line
const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={styles.detailValueContainer}>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  </View>
);

const EditableDetailRow = ({
  label,
  value,
  editable,
  onChangeText,
}: {
  label: string;
  value?: string;
  editable: boolean;
  onChangeText: (text: string) => void;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <View style={styles.detailValueContainer}>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
          style={[
            styles.detailValue,
            {
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              paddingVertical: 4,
            },
          ]}
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <Text style={styles.detailValue}>{value || '—'}</Text>
      )}
    </View>
  </View>
);
 
export default AccountScreen;
 