// default file that expo will grab for the import in map.tsx
// if you are using Expo Go/are on mobile
import React, { useEffect,useMemo, useState } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import { currentUser, friends, UserLocation } from '@/data/mockLocations';
import { getDistanceMeters, formatDistance } from '@/utils/distance';
import { searchUserByUserName, sendFriendRequest } from '@/services/friendService';
import type { UserLocation as FriendSearchUser } from '@/types/friend';
import { styles } from '@/app/(app)/map/_styles'; // Use your external styles
import ProfileModal from '@/components/ProfileModal';
import { getCurrentUserProfile,UserProfile } from '@/services/profileService';

export default function MapComponent() {

  // the current selected friend, then use the function, base on select state
  const[selectedFriend, setSelectedFriend] = useState< UserLocation| null>(null); // null default
  const[selectedPlaceName, setSelectedPlaceName] = useState<string>('Loading location...');

    // add friend modal states
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchUser[]>([]);
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // replace this with your real logged-in user id later if needed
 const currentUserId = Number(currentUser.id ?? 1);

  // useMemo : only recompute distance text when selected friend change
  const distanceText = useMemo( () => {
    if (!selectedFriend) return '';
    const meters = getDistanceMeters(currentUser, selectedFriend);
    return formatDistance(meters);
  }, [selectedFriend]); //recompute distance text when we have selected friend

  //User Profile use to manipulate the pop-up modal
  const [profileVisible, setProfileVisible] = useState(false);
  const [profile,setProfile] = useState <UserProfile |null>(null);

  useEffect(() => {
    async function loadProfile(){
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    }
    loadProfile();
  },[]) // the effect does not rerun when it reloading the page
  

  // function get the name of place, async- get data from server
  async function handleFriendPress(friend: UserLocation){
    setSelectedFriend(friend);
    setSelectedPlaceName('Loading Location...');
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: friend.latitude,
        longitude: friend.longitude,
      });

      if (results.length > 0) {
        const place = results[0];
        const label =
          [
            place.name,
            place.street,
            place.city,
            place.region,
          ]
            .filter(Boolean)
            .join(', ') || 'Location found';
        setSelectedPlaceName(label);
      } else {
        setSelectedPlaceName('No place name found');
      }
    } catch (error) {
      setSelectedPlaceName('Could not load location name');
      console.log('Reverse geocoding error:', error);
    }
  }

  /// function for Handling for Search Bar - add friend 
  async function handleSearchChange(text: string) {
    setSearchText(text);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const users = await searchUserByUserName(text);

      // do not show yourself in search result
      const filteredUsers = users.filter((user) => user.id !== currentUserId);
      setSearchResults(filteredUsers);
    } catch (error) {
        console.log('search users error:', error);
      setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  }

  async function handleAddFriend(targetUserId: number) {
    const isRequested = requestedIds.includes(targetUserId);

    if (isRequested) {
      setRequestedIds((prev) => prev.filter((id) => id !== targetUserId));
      return;
    }

    setRequestedIds((prev) => [...prev, targetUserId]);

    try {
      await sendFriendRequest(currentUserId, targetUserId);
    } catch (error) {
      console.log('send friend request error:', error);

      // rollback if request failed
      setRequestedIds((prev) => prev.filter((id) => id !== targetUserId));
    }
  }

  function closeSearchModal() {
    setSearchModalVisible(false);
    setSearchText('');
    setSearchResults([]);
    setIsSearching(false);
  }

  // query the user for their location 
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function setupLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionGranted(false);
        return;
      }

      setPermissionGranted(true);

      const currentLocation = await Location.getCurrentPositionAsync();
      setUserLocation(currentLocation);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // in ms
          distanceInterval: 10, // in meters
        },
        (updatedLocation) => {
          setUserLocation(updatedLocation);
        }
      );
    }

    setupLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  if (permissionGranted === null || (permissionGranted === true && userLocation === null)) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 }]}>
        <Text style={{ fontSize: 16, textAlign: 'center' }}>Location access is required to use the map.</Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>Please enable it in your device settings.</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{ marginTop: 8, backgroundColor: '#15fbef', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ fontWeight: '600' }}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentUser.latitude,
            longitude: currentUser.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* User detail on top of the marker on map */}
          <Marker
            coordinate={{
              latitude: currentUser.latitude,
              longitude: currentUser.longitude,
            }}
            title={currentUser.name}
            description="Your location"
          />

          {friends.map((friend) => (
            <Marker
              key={friend.id}
              coordinate={{
                latitude: friend.latitude,
                longitude: friend.longitude,
              }}
              onPress={() => handleFriendPress(friend)}
            >
              <Callout>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>{friend.name}</Text>
                  <Text>Friend</Text>
                  <Text>
                    Location: {friend.latitude.toFixed(4)}, {friend.longitude.toFixed(4)}
                  </Text>
                  <Text>
                    Distance: {distanceText || formatDistance(getDistanceMeters(currentUser, friend))}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
          {/* draw the line between 2 users for illustrate the distance  */}
          {selectedFriend && (
            <Polyline
              coordinates={[
                {
                  latitude: currentUser.latitude,
                  longitude: currentUser.longitude,
                },
                {
                  latitude: selectedFriend.latitude,
                  longitude: selectedFriend.longitude,
                },
              ]}
              strokeColor="#15fbef"
              strokeWidth={6}
            />
          )}
        </MapView>

        {/* add profile button */}
        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => setProfileVisible(true)}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../../assets/images/default-avatar.png')}
            style={styles.profileAvatar}
          />

        </TouchableOpacity>

        {/* add friend button */}
        <TouchableOpacity
          style={styles.addFriendCircle}
          onPress={() => setSearchModalVisible(true)}
        >
          <Text style={styles.circleButtonText}>+</Text>
        </TouchableOpacity>

        {/* notification bell UI only for now */}
        <TouchableOpacity style={styles.bellCircle}>
          <Text style={styles.circleButtonText}>🔔</Text>
        </TouchableOpacity>

        {/* search modal */}
        <Modal
          visible={searchModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={closeSearchModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search username..."
                  value={searchText}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {isSearching ? <Text style={styles.searchInfoText}>Searching...</Text> : null}

              {!isSearching && searchText.trim() && searchResults.length === 0 ? (
                <Text style={styles.searchInfoText}>No users found</Text>
              ) : null}

              <FlatList
                data={searchResults}
                extraData={requestedIds}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isRequested = requestedIds.includes(item.id);

                  return (
                    <View style={styles.resultRow}>
                      <View style={styles.resultTextBox}>
                        <Text style={styles.resultName}>
                          {item.full_name || item.username}
                        </Text>
                        <Text style={styles.resultUsername}>@{item.username}</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          isRequested && styles.requestedButton,
                        ]}
                        onPress={() => handleAddFriend(item.id)}
                      >
                        <Text style={styles.addButtonText}>
                          {isRequested ? 'Requested' : 'Add Friend'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Profile Modal */}
        <ProfileModal
          visible={profileVisible}
          onClose={() => setProfileVisible(false)}
          profile={profile}
        />

        
        {/* A Card at the bottom about name and current location of user */}
        {selectedFriend && (
          <View style={styles.bottomCard}>
            <Text style={styles.cardTitle}>{selectedFriend.name}</Text>
            <Text>Type: Friend</Text>
            <Text>
              Location: {selectedFriend.latitude.toFixed(4)}, {selectedFriend.longitude.toFixed(4)}
            </Text>
            <Text>Hey, I’m at {selectedPlaceName} now !! </Text>
            <Text>Distance: {distanceText}</Text>
          </View>
        )}
      </View>
    );
}

