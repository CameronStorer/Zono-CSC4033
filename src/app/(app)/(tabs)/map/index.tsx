import React, { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Linking, AppState } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { getDistanceMeters, formatDistance } from '@/utils/distance';
import { searchUserByUserName, sendFriendRequest, cancelFriendRequest} from '@/services/friendService';
import type { UserLocation as FriendSearchUser } from '@/types/friend';
import { makeStyles } from '@/app/(app)/(tabs)/map/_styles';
import FriendRequestNotificationModal from '@/components/FriendRequestNotificationModal';
import { updateUserLocation } from '@/services/profileService';
import { supabase } from '@/components/supabase'; 
import { useAuth } from '@/components/auth-context';
import UserMarker from '@/components/user-marker';
import {getIncomingFriendRequests,acceptFriendRequest,deleteFriendRequest,} from '@/services/notificationService';
import { useAppTheme } from '@/contexts/theme-context';
import { darkMapStyle } from '@/constants/map-styles';
import { SlideScreen } from '@/components/slide-screen';
import FriendJoinedModal from '@/components/FriendJoinedModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// ── Sticker feature imports ──────────────────────────────────
import EmojiPickerSheet from '@/components/emoji/emojiPickerSheet';
import FlyingStickerLayer from '@/components/emoji/FlyingStickerLayer';
import IncomingStickerOverlay, { SenderInfo } from '@/components/emoji/IncomingStickerOverlay';
import {
  sendEmojiReaction,
  subscribeToIncomingEmojiReactions,
  markReactionSeen,getUnseenEmojiReactions,
} from '@/services/emojiReactionService';
import { EmojiReaction } from '@/types/emojiReaction';
import { StickerItem } from '@/data/stickers';

type MapFriend = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  avatarUrl: string | null;
  initials: string;
  isOnline: boolean;
  lastSeen: string | null;
};

export default function Map() {
  const { colors: C, resolved } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  // the current selected friend, then use the function, base on select state
  const [selectedFriend, setSelectedFriend] = useState<MapFriend | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('Loading location...');

  // add friend modal states
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchUser[]>([]);
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [mapFriends, setMapFriends] = useState<MapFriend[]>([]);
  const mapRef = useRef<MapView>(null);
  const [friendIds, setFriendIds] = useState<number[]>([]); // tia: keeps track of who is already your friend
  const [friendCounts, setFriendCounts] = useState<Record<number, number>>({}); // store user friend count

  //Notificaiton
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const hasNotifications = incomingRequests.length > 0;
  const [joinedModalVisible, setJoinedModalVisible] = useState(false);
  const [joinedFriend, setJoinedFriend] = useState<any | null>(null);

  //Blocked
  const [blockedIds, setBlockedIds] = useState<number[]>([]);

  // ── Sticker feature state ────────────────────────────────────

  const [stickerSheetVisible, setStickerSheetVisible] = useState(false);

  const [flyingSticker, setFlyingSticker] = useState<{
    sticker: StickerItem;
    sizeMultiplier: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  // Queue: reactions waiting to be shown (oldest first)
  const [reactionQueue, setReactionQueue] = useState<EmojiReaction[]>([]);

  // Currently displayed reaction (null = overlay hidden)
  const [currentReaction, setCurrentReaction] = useState<EmojiReaction | null>(null);
  const [currentSender, setCurrentSender]     = useState<SenderInfo | null>(null);

  // Prevents showing two overlays at the same time
  const isShowingReaction = useRef(false);

  // useMemo : only recompute distance text when selected friend change
  const distanceText = useMemo( () => {
    if (!selectedFriend) return '';
    const meters = getDistanceMeters({ latitude: userLocation!.coords.latitude, longitude: userLocation!.coords.longitude }, selectedFriend);
    return formatDistance(meters);
  }, [selectedFriend]); //recompute distance text when we have selected friend

  // Current logged-in user profile
  const { profile } = useAuth();
  const currentUserId = profile?.id;

  useEffect(() => {
  if (!currentUserId) return;

  async function updatePresence(isOnline: boolean) {
    await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', currentUserId);
      
  }

  updatePresence(true);

  const interval = setInterval(() => {
    updatePresence(true);
  }, 30000);

  const subscription = AppState.addEventListener('change', (state) => {
    
    if (state === 'active') {
      updatePresence(true);
    }

    if (state == 'background') {
      updatePresence(false);
    }
  });

  return () => {
    clearInterval(interval);
    subscription.remove();
    updatePresence(false);
  };
}, [currentUserId]);


  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // write coordinates as soon as the user is found and the location is known
  useEffect(() => {
    if (profile?.id && userLocation) {
      updateUserLocation(
        profile.id,
        userLocation.coords.latitude,
        userLocation.coords.longitude
      );
    }
  }, [profile?.id]);

    useEffect(() => {
      if (currentUserId) {
        loadIncomingRequests();
      }
    }, [currentUserId]);

  // Fetches the latest lat/lng + avatar for every friend and updates map markers.
  // Called on mount and every 10 s from the watchPositionAsync callback.
  async function loadFriendsForMap(userId: number) {
    try {
      const { data: rows } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId);
      const ids = (rows ?? []).map((r: any) => r.friend_id);
      if (!ids.length) { setMapFriends([]); return; }
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, username, last_lat, last_lng, avatar_url, is_online, last_seen')
        .in('id', ids);
      const located: MapFriend[] = (users ?? [])
        .filter((u: any) => u.last_lat != null && u.last_lng != null)
        .map((u: any) => {
          const displayName: string = u.full_name || u.username || 'Unknown';
          return {
            id: String(u.id),
            name: displayName,
            latitude: u.last_lat as number,
            longitude: u.last_lng as number,
            avatarUrl: u.avatar_url ?? null,
            initials: displayName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            isOnline:
              Boolean(u.is_online) &&
              Boolean(u.last_seen) &&
              Date.now() - new Date(u.last_seen).getTime() < 60000,

            lastSeen: u.last_seen ?? null,
          };
        });
      setMapFriends(located);
    } catch (error) {
      console.log('loadFriendsForMap error:', error);
  }
}

  useEffect(() => {
    if (profile?.id) loadFriendsForMap(profile.id);
  }, [profile?.id]);

  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
    loadFriendsForMap(currentUserId);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedFriend) return;

    const updatedFriend = mapFriends.find(
      (friend) => friend.id === selectedFriend.id
    );

    if (updatedFriend) {
      setSelectedFriend(updatedFriend);
    }
  }, [mapFriends]);

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  
  // ── Queue processor ──────────────────────────────────────────
  // Watches the queue and shows one reaction at a time.
  // Fires automatically whenever reactionQueue changes.
  useEffect(() => {
    if (isShowingReaction.current) return;  // already showing one
    if (reactionQueue.length === 0) return; // nothing to show

    const [next, ...rest] = reactionQueue;
    setReactionQueue(rest);
    isShowingReaction.current = true;
    resolveSenderAndShow(next);
  }, [reactionQueue]);

  // ── Fetch unseen reactions + subscribe to Realtime ───────────
  // A: Fetch from DB on mount → catches offline/missed reactions
  // B: Realtime → instant delivery while user is online
  // Both add to the queue — processor handles display order
  useEffect(() => {
    if (!currentUserId) return;

    // A. Fetch unseen reactions from database (offline inbox)
    getUnseenEmojiReactions(currentUserId)
      .then((unseen) => {
        if (unseen.length > 0) {
          setReactionQueue((prev) => [...prev, ...unseen]);
        }
      })
      .catch((err) =>
        console.log('[Map] getUnseenEmojiReactions error:', err)
      );

    // B. Listen for new reactions via Realtime (online delivery)
    const unsubscribe = subscribeToIncomingEmojiReactions(
      currentUserId,
      (reaction) => {
        setReactionQueue((prev) => [...prev, reaction]);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // function get the name of place, async- get data from server
  async function handleFriendPress(friend: MapFriend) {
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

  // SEARCH / ADD FRIEND FUNCTIONS
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

      const existingFriendIds = friendshipData?.map((row) => Number(row.friend_id)) ?? [];
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
  async function handleCancelRequest(targetUserId: number) {
    if (!currentUserId) return;

    try {
      await cancelFriendRequest(currentUserId, targetUserId);

      setRequestedIds((prev) => prev.filter((id) => id !== targetUserId ));
    } catch (error) {
      console.log('cancel friend request error:', error);
    }
  }

  // NOTIFICATION FUNCTIONS
    async function loadIncomingRequests() {
    if (!currentUserId) return;
    try {
      const requests = await getIncomingFriendRequests(currentUserId);
      setIncomingRequests(requests);
    } catch (error) {
      console.log('load incoming requests error:', error);
    }
  }
  async function handleAcceptRequest(requestId: number, senderId: number) {
    if (!currentUserId) return;

    try {
      const acceptedRequest = incomingRequests.find((request) => Number(request.id) === Number(requestId));
      console.log('Accepted request found:', acceptedRequest);

      await acceptFriendRequest(requestId, currentUserId, senderId);

      setFriendIds((prev) => prev.includes(senderId) ? prev : [...prev, senderId]);
      setRequestedIds((prev) => prev.filter((id) => id !== senderId));
      setIncomingRequests((prev) => prev.filter((request) => Number(request.id) !== Number(requestId)));

      setNotificationVisible(false);

      // Show joined modal after the first modal closes
      if (acceptedRequest) {
        setJoinedFriend({
          ...acceptedRequest,
          accepted_at: new Date().toISOString(),
        });

        setTimeout(() => {
          setJoinedModalVisible(true);
        }, 250);
      }
    } catch (error) {
      console.log('accept friend request error:', error);
    }
  }
  async function handleDeleteRequest(requestId: number) {
    try {
      await deleteFriendRequest(requestId);

      setIncomingRequests((prev) => prev.filter((request) => request.id !== requestId));
    } 
    catch (error) {
      console.log('delete friend request error:', error);
    }
  }

  // FRIEND MANAGEMENT FUNCTIONS - tia unfollow function
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

  async function handleBlockUsers(targetUserId: number) {
  
  if (!currentUserId) return;

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

    setBlockedIds((prev) => [...prev, targetUserId]);
    console.log('User BLOCKED!');
  } catch (error) {
    console.log('block user error:', error);
  }
}


  async function handleUnblockUser(targetUserId: number) {

  if (!currentUserId) return;

    try {

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId);

      if (error) {
        console.log('unblock user error:', error);
        return;
      }

    setBlockedIds((prev) => prev.filter((id) => id !== targetUserId));
    console.log('User UNBLOCKED!');
  } catch (error) {
    console.log('unblock user error:', error);
  }
}

  // MODAL FUNCTIONS
  function closeSearchModal() {
    setSearchModalVisible(false);
    setSearchText('');
    setSearchResults([]);
    setIsSearching(false);
  }

  // ── STICKER FUNCTIONS ─────────────────────────────────────────

// Called by EmojiPickerSheet when user taps or releases a sticker.
// Saves the reaction to Supabase then launches the flying animation.
async function handleSendSticker(sticker: StickerItem, sizeMultiplier: number) {
  if (!currentUserId || !selectedFriend) return;

  try {
    // Insert into emoji_reactions — this triggers the receiver's realtime listener
    await sendEmojiReaction({
      sender_id: currentUserId,
      receiver_id: Number(selectedFriend.id), // MapFriend.id is string → convert
      sticker_id: sticker.id,
      sticker_label: sticker.label,
      size_multiplier: sizeMultiplier,
      count: 1,
      sender_lat: userLocation?.coords.latitude ?? null,
      sender_lng: userLocation?.coords.longitude ?? null,
    });

    // Launch the flying sticker on OUR screen
    await launchFlyingSticker(sticker, sizeMultiplier);
  } catch (error) {
    console.log('[Map] handleSendSticker error:', error);
  }
}

// Converts the friend's lat/lng to screen pixels using the map ref,
// then sets state so FlyingStickerLayer renders and animates.
async function launchFlyingSticker(sticker: StickerItem, sizeMultiplier: number) {
    if (!mapRef.current || !selectedFriend) return;

    try {
      // pointForCoordinate: lat/lng → { x, y } screen pixel position
      const point = await mapRef.current.pointForCoordinate({
        latitude: selectedFriend.latitude,
        longitude: selectedFriend.longitude,
      });

      setFlyingSticker({
        sticker,
        sizeMultiplier,
        targetX: point.x,
        targetY: point.y,
      });
    } catch (error) {
      console.log('[Map] launchFlyingSticker error:', error);
    }
  }
  // ── Looks up sender profile then shows the overlay ───────────
  // Called by the queue processor for each reaction in the queue.
  async function resolveSenderAndShow(reaction: EmojiReaction) {
    // Check mapFriends first — no network call needed
    const friendOnMap = mapFriends.find(
      (f) => Number(f.id) === reaction.sender_id
    );

    if (friendOnMap) {
      setCurrentSender({
        username: friendOnMap.name,
        full_name: friendOnMap.name,
        avatar_url: friendOnMap.avatarUrl,
      });
    } else {
      // Not a friend on map — fetch from Supabase
      try {
        const { data } = await supabase
          .from('users')
          .select('username, full_name, avatar_url')
          .eq('id', reaction.sender_id)
          .single();
        setCurrentSender({
          username: data?.username ?? 'Someone',
          full_name: data?.full_name ?? null,
          avatar_url: data?.avatar_url ?? null,
        });
      } catch {
        setCurrentSender({
          username: 'Someone',
          full_name: null,
          avatar_url: null,
        });
      }
    }

    // Zoom map to sender location if shared
    if (reaction.sender_lat && reaction.sender_lng) {
      mapRef.current?.animateToRegion(
        {
          latitude: reaction.sender_lat,
          longitude: reaction.sender_lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800
      );
    }

    setCurrentReaction(reaction);
  }

  // ── Called when IncomingStickerOverlay finishes animating ─────
  // Marks reaction seen, hides overlay, allows queue to continue.
  function handleReactionComplete() {
    if (currentReaction) {
      markReactionSeen(currentReaction.id);
    }
    setCurrentReaction(null);
    setCurrentSender(null);
    isShowingReaction.current = false;
    // reactionQueue useEffect will fire again and show next item
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

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
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
          if (profileRef.current?.id) {
            updateUserLocation(
              profileRef.current.id,
              updatedLocation.coords.latitude,
              updatedLocation.coords.longitude
            );
            // Pull fresh friend positions on the same 10-second cadence
            loadFriendsForMap(profileRef.current.id);
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
          ref={mapRef}
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

          {mapFriends.map((friend) => (
            <UserMarker
              key={friend.id}
              coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
              avatarUrl={friend.avatarUrl}
              initials={friend.initials}
              borderColor={C.accent}
              onPress={() => handleFriendPress(friend)}
            />
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
          onPress={() => router.push('/profile')}
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

        {/* notification bell */}
        <TouchableOpacity
          style={styles.bellCircle}
          onPress={() => {
            loadIncomingRequests();
            setNotificationVisible(true);
          }}
        >
          <Text style={styles.circleButtonText}>🔔</Text>
          {hasNotifications && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>

        {/* center on me */}
        <TouchableOpacity
          style={styles.locateCircle}
          onPress={() => {
            if (userLocation) {
              mapRef.current?.animateToRegion({
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }, 500);
            }
          }}
        >
          <Text style={styles.circleButtonText}>◎</Text>
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

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (isRequested || isFriend) && styles.requestedButton,
                  ]}
                  onPress={() => {
                    if (isFriend) {
                      handleUnfollow(itemId);
                    } else if (isRequested) {
                      handleCancelRequest(itemId);
                    } else {
                      handleAddFriend(itemId);
                    }
                  }}
                >
                  <Text style={styles.addButtonText}>
                    {isFriend ? 'Unfollow' : isRequested ? 'Requested' : 'Add Friend'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() =>
                    blockedIds.includes(itemId)
                      ? handleUnblockUser(itemId)
                      : handleBlockUsers(itemId)
                  }
                >
                  <Text style={styles.addButtonText}>
                    {blockedIds.includes(itemId) ? 'Unblock' : 'Block'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
              );
              }}
            />
            </View>
          </View>
        </Modal>

        <FriendRequestNotificationModal
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
          requests={incomingRequests}
          onAccept={handleAcceptRequest}
          onDelete={handleDeleteRequest}
        />
        <FriendJoinedModal
          visible={joinedModalVisible}
          friend={joinedFriend}
          onClose={() => {
            setJoinedModalVisible(false);
            setJoinedFriend(null);
          }}
        />

        {selectedFriend && (
          <View
            style={[
              styles.bottomCard,
              {
                // Push the card above the tab bar:
                bottom: insets.bottom + 90,
              },
            ]}
          >
            {/* ── Close button ── */}
            <TouchableOpacity
              onPress={() => {
                setSelectedFriend(null);
                setSelectedPlaceName('');
                setStickerSheetVisible(false); // close sticker sheet too if open
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                padding: 4,
                zIndex: 10,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            {/* ── Friend info ── */}
            <Text style={styles.cardTitle}>{selectedFriend.name}</Text>
            <Text style={{ color: '#ffffff', marginBottom: 4 }}>
              {selectedFriend.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </Text>
            <Text style={{ color: '#ffffff', marginBottom: 4 }}>
              📍 {selectedPlaceName}
            </Text>
            <Text style={{ color: '#ffffff' }}>Distance: {distanceText}</Text>

            {/* ── Send Sticker button ── */}
            <TouchableOpacity
              onPress={() => setStickerSheetVisible(true)}
              style={{
                marginTop: 10,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                paddingVertical: 8,
                paddingHorizontal: 16,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                🎯 Send Sticker
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* ── STICKER PICKER SHEET ──────────────────────── */}
        <EmojiPickerSheet
          visible={stickerSheetVisible}
          friend={
            selectedFriend
              ? {
                  id: Number(selectedFriend.id),
                  username: selectedFriend.name,
                  full_name: selectedFriend.name,
                  avatar_url: selectedFriend.avatarUrl,
                }
              : null
          }
          onSend={handleSendSticker}
          onClose={() => setStickerSheetVisible(false)}
        />

        {/* ── FLYING STICKER (sender side) ──────────────── */}
        {flyingSticker && (
          <FlyingStickerLayer
            sticker={flyingSticker.sticker}
            sizeMultiplier={flyingSticker.sizeMultiplier}
            targetX={flyingSticker.targetX}
            targetY={flyingSticker.targetY}
            onComplete={() => setFlyingSticker(null)}
          />
        )}

        {/* ── INCOMING STICKER OVERLAY (receiver side) ──── */}
        {currentReaction && currentSender && (
          <IncomingStickerOverlay
            reaction={currentReaction}
            senderInfo={currentSender}
            onComplete={handleReactionComplete}
          />
        )}
      </View>
    </SlideScreen>
    );
}
