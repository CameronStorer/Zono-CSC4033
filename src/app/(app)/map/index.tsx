import React, { useEffect, useMemo, useState } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { currentUser, friends, UserLocation } from '@/data/mockLocations';
import { getDistanceMeters, formatDistance } from '@/utils/distance';
import { searchUserByUserName, sendFriendRequest, cancelFriendRequest} from '@/services/friendService';
import type { UserLocation as FriendSearchUser } from '@/types/friend';
import { makeStyles } from '@/app/(app)/map/_styles';
import ProfileModal from '@/components/ProfileModal';
import { updateUserLocation } from '@/services/profileService';
import { supabase } from '@/components/supabase'; // tia
import { useAuth } from '@/components/auth-context';
import UserMarker from '@/components/user-marker';
import { useAppTheme } from '@/contexts/theme-context';
import { darkMapStyle } from '@/constants/map-styles';
import { SlideScreen } from '@/components/slide-screen';

export default function Map() {
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  // the current selected friend, then use the function, base on select state
  const [selectedFriend, setSelectedFriend] = useState< UserLocation| null>(null); // null default
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('Loading location...');

  // add friend modal states
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchUser[]>([]);
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [friendIds, setFriendIds] = useState<number[]>([]); // tia: keeps track of who is already your friend
  const [friendCounts, setFriendCounts] = useState<Record<number, number>>({}); // store user friend count

  // useMemo : only recompute distance text when selected friend change
  const distanceText = useMemo( () => {
    if (!selectedFriend) return '';
    const meters = getDistanceMeters({ latitude: userLocation!.coords.latitude, longitude: userLocation!.coords.longitude }, selectedFriend);
    return formatDistance(meters);
  }, [selectedFriend]); //recompute distance text when we have selected friend

  //User Profile use to manipulate the pop-up modal
  const [profileVisible, setProfileVisible] = useState(false);
  const { profile } = useAuth();
  // replace this with your real logged-in user id later if needed
  //const currentUserId = Number(currentUser.id ?? 1);
  const currentUserId = profile?.id;
  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  

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
  // tia - made changes so now it shows if they are friends or not
  async function handleSearchChange(text: string) {
    setSearchText(text);

    if (!currentUserId) {
      console.log('No current user id found yet');
      return;
    }

    if (!text.trim()) {
      setSearchResults([]);
      setFriendIds([]);
      setRequestedIds([]);
      setFriendCounts({});
      return;
    }

    try {
      setIsSearching(true);
      // 1. search all the user from database
      const users = await searchUserByUserName(text.trim());

      // get people who blocked you
      const { data: blockedMe, error: blockedError } = await supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', currentUserId);

      if (blockedError) {
        console.log('block lookup error:', blockedError);
        return;
      }

      const hiddenUsersIds = blockedMe?.map((row) => Number(row.blocker_id)) ?? [];

      const filteredUsers = users.filter(
        (user) =>
          Number(user.id) !== currentUserId &&
          !hiddenUsersIds.includes(Number(user.id))
      );

      const searchedUserIds = filteredUsers.map((user) => Number(user.id));

      if (searchedUserIds.length === 0) {
        setSearchResults([]);
        setFriendIds([]);
        setRequestedIds([]);
        setFriendCounts({});
        return;
      }

      // 3. Check which searched users are already friends with current user
      const { data: friendshipData, error: friendshipError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', currentUserId)
        .in('friend_id', searchedUserIds);

      if (friendshipError) {
        console.log('friendship lookup error:', friendshipError);
      }

      const existingFriendIds = friendshipData?.map((row) => (row.friend_id)) ?? []; 
      setFriendIds(existingFriendIds);

      // 4. Check which searched users already have pending request from current user
      const { data: pendingRequestData, error: pendingRequestError } =
        await supabase
          .from('friend_requests')
          .select('receiver_id')
          .eq('sender_id', currentUserId)
          .eq('status', 'pending')
          .in('receiver_id', searchedUserIds);

      if (pendingRequestError) {
        console.log('pending request lookup error:', pendingRequestError);
      }

      const existingRequestedIds = pendingRequestData?.map((row)=> Number(row.receiver_id)) ?? [];
      setRequestedIds(existingRequestedIds);

      //5. Count how many friends each searched user has
      const { data: friendCountData, error: friendCountError } = await supabase
        .from('friendships')
        .select('user_id')
        .in('user_id', searchedUserIds);

      if (friendCountError) {
        console.log('friend count lookup error:', friendCountError);
      }
      const counts: Record<number,number> = {};

      searchedUserIds.forEach((id) => {
        counts[id] = 0; 
      });

      friendCountData?.forEach((row) => {
        const userId = Number(row.user_id);
        counts[userId] = (counts[userId] ?? 0) + 1; // if userId already exist use that num +1, if not start with 0
      });

      setFriendCounts(counts);
      // 6. Show searched users
      setSearchResults(filteredUsers);
    } catch (error) {
        console.log('search users error:', error);
        setSearchResults([]);
        setFriendIds([]);
        setRequestedIds([]);
        setFriendCounts({});
      } finally {
        setIsSearching(false);
      }
  }

  async function handleAddFriend(targetUserId: number) {
  if (!currentUserId){
    console.log("No log in user found");
    return;
  }
  try{
    await sendFriendRequest(currentUserId,targetUserId);
    setRequestedIds((prevRequestId) =>[...prevRequestId, targetUserId]);
  }catch (error){
    console.log("send friend request error", error);
  }
}

  // tia unfollow function
  async function handleUnfollow(targetUserId: number) {
  try {

    // delete the friendship row from supabase
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', currentUserId)
      .eq('friend_id', targetUserId);


    // if supabase throws an error, throw the error on the app
    if (error) {
      console.log('unfollow error:', error);
      return;
    }

    // remove the removed friend from the friend's list. makes it
    // go from unfollow friend back to add friend
    setFriendIds((prev) => prev.filter((id) => id !== targetUserId));
 
    // throw any other errors that may appear
  } catch (error) {
    console.log('unfollow error:', error);
  }
}

  async function handleCancelRequest(targetUserId: number) {
    if (!currentUserId) return;

    try {
      await cancelFriendRequest(currentUserId, targetUserId);

      setRequestedIds((prev) => prev.filter((id) => id !== targetUserId ));
    } catch (error) {
      console.log('cancel friend request error:', error);
    }
  }

async function handleBlockUsers(targetUserId: number) {
  try {

    const { error } = await supabase
      .from('blocks')
      .insert({
        blocker_id: currentUserId,
        blocked_id: targetUserId,
      });

    // if supabase throws an error, throw the error on the app
    if (error) {
      console.log('unfollow error:', error);
      return;
    }

    console.log('User BLOCKED !');
  } catch (error) {
      console.log('block user error:', error);
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

      // prevents map buffering after granting user permissions
      const lastKnownLocation = await Location.getLastKnownPositionAsync();
      if (lastKnownLocation) {
        setUserLocation(lastKnownLocation);
      }

      const currentLocation = await Location.getCurrentPositionAsync();
      setUserLocation(currentLocation);

      subscription = await Location.watchPositionAsync(
        // update options for active location polling
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // in ms
          distanceInterval: 10, // in meters
        },
        (updatedLocation) => {
          setUserLocation(updatedLocation);
          if (profile?.id) {
            updateUserLocation(
              profile.id,
              updatedLocation.coords.latitude,
              updatedLocation.coords.longitude
            );
          }
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.text }}>Getting your location...</Text>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24, backgroundColor: C.bg }]}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: C.text }}>Location access is required to use the map.</Text>
        <Text style={{ textAlign: 'center', color: C.textSecondary }}>Please enable it in your device settings.</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          style={{ marginTop: 8, backgroundColor: C.mapOpenSettingsBtn, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ fontWeight: '600' }}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SlideScreen index={0}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          userInterfaceStyle={resolved}
          customMapStyle={resolved === 'dark' ? darkMapStyle : []}
          initialRegion={{
            latitude: userLocation!.coords.latitude,
            longitude: userLocation!.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* User detail on top of the marker on map */}
          <UserMarker
            coordinate={{
              latitude: userLocation!.coords.latitude,
              longitude: userLocation!.coords.longitude,
            }}
            avatarUrl={profile?.avatar_url ?? null}
            initials={initials}
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
                  latitude: userLocation!.coords.latitude,
                  longitude: userLocation!.coords.longitude,
                },
                {
                  latitude: selectedFriend.latitude,
                  longitude: selectedFriend.longitude,
                },
              ]}
              strokeColor={C.mapPolyline}
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
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatar} />
            : <View style={{ width: '100%', height: '100%', backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={styles.profileCircleText}>{initials}</Text>
              </View>
          }

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
                extraData={{ requestedIds, friendIds, friendCounts }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const itemId = Number(item.id);
                  const isRequested = requestedIds.includes(itemId);
                  const isFriend = friendIds.includes(itemId);
                  const count = friendCounts[itemId] ?? 0;

                  return (
                    <View style={styles.resultRow}>
                      <View style={styles.resultTextBox}>
                        <Text style={styles.resultName}>
                          {item.full_name || item.username}
                        </Text>

                        <Text style={styles.resultUsername}>@{item.username}</Text>

                        <Text style={styles.resultUsername}>
                          {isFriend
                            ? `Friends with you • ${count} ${count === 1 ? 'friend' : 'friends'}`
                            : `${count} ${count === 1 ? 'friend' : 'friends'}`}
                        </Text>
                      </View>

                      {!isFriend && (
                        <TouchableOpacity
                          style={[
                            styles.addButton,
                            isRequested && styles.requestedButton,
                          ]}
                          onPress={() => {
                            if (isRequested) {
                              handleCancelRequest(itemId);
                            } else {
                              handleAddFriend(itemId);
                            }
                          }}
                        >
                          <Text style={styles.addButtonText}>
                            {isRequested ? 'Requested' : 'Add Friend'}
                          </Text>
                        </TouchableOpacity>
                      )}
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
    </SlideScreen>
    );
}
