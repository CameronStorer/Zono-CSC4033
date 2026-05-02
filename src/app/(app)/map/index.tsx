// default file that expo will grab for the import in map.tsx
// if you are using Expo Go/are on mobile
import React, {use, useEffect,useMemo, useState } from 'react';
import MapView, {Marker, Polyline, Callout} from 'react-native-maps';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import * as Location from 'expo-location';
import { currentUser, friends, UserLocation } from '@/data/mockLocations';
import { getDistanceMeters, formatDistance } from '@/utils/distance';
import { searchUserByUserName, sendFriendRequest, cancelFriendRequest} from '@/services/friendService';
import type { UserLocation as FriendSearchUser } from '@/types/friend';
import { styles } from '@/app/(app)/map/_styles'; // Use your external styles
import ProfileModal from '@/components/ProfileModal';
import { getCurrentUserProfile,UserProfile } from '@/services/profileService';
import { supabase } from '@/components/supabase'; // tia
import { Filter } from 'react-native-svg';

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
  const [friendIds, setFriendIds] = useState<number[]>([]); // tia: keeps track of who is already your friend
  const [friendCounts, setFriendCounts] =  useState<Record<number,number>>({}); // store user friend count

  // useMemo : only recompute distance text when selected friend change
  const distanceText = useMemo( () => {
    if (!selectedFriend) return '';
    const meters = getDistanceMeters(currentUser, selectedFriend);
    return formatDistance(meters);
  }, [selectedFriend]); //recompute distance text when we have selected friend

  //User Profile use to manipulate the pop-up modal
  const [profileVisible, setProfileVisible] = useState(false);
  const [profile,setProfile] = useState <UserProfile |null>(null);
  // replace this with your real logged-in user id later if needed
  const currentUserId = profile?.id;

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
  // tia - made changes so now it shows if they are friends or not
  async function handleSearchChange(text: string) {
    setSearchText(text);

    //no real text - setting nothing
    if (!text.trim()){
      setSearchResults([]);
      setFriendIds([]);
      setRequestedIds([]);
      setFriendCounts({});
      return;
    }

    if (!currentUserId) {
      console.log('No current user profile yet');
      return;
    }

    try {
      setIsSearching(true);
      // 1. search all the user from database
      const users = await searchUserByUserName(text.trim());
      // 2. remove yourself from the search result
      const filteredUsers = users.filter(
        (user) => Number(user.id) !== Number(currentUserId));
      // get all the IDs of the user not including your self
      const searchedUserIds = filteredUsers.map((user) => Number(user.id)); 

      if (searchedUserIds.length == 0){
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

  function closeSearchModal() {
    setSearchModalVisible(false);
    setSearchText('');
    setSearchResults([]);
    setIsSearching(false);
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
                const itemId = Number(item.id);
                const isRequested = requestedIds.includes(itemId);
                const isFriend = friendIds.includes(itemId);
                const count = friendCounts[itemId] ?? 0

                return (
                  <View style={styles.resultRow}>
                    <View style={styles.resultTextBox}>
                      <Text style={styles.resultName}>
                        {item.full_name || item.username}
                      </Text>

                      <Text style={styles.resultUsername}>@{item.username}</Text>

                      <Text style={styles.resultUsername}>
                          {isFriend? `Friends with you • ${count} ${count === 1 ? 'friend' : 'friends'}`
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