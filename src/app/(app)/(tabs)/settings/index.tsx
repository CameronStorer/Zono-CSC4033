import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, TextInput,
  Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { makeStyles } from './_style';
import { supabase, supabaseAdmin } from '@/components/supabase';
import { useAuth } from '@/components/auth-context';
import { useAppTheme, ThemePreference } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';

function EditFieldModal({
  visible, label, value, multiline, onCancel, onSave, saving, styles,
}: {
  visible: boolean;
  label: string;
  value: string;
  multiline?: boolean;
  onCancel: () => void;
  onSave: (value: string) => void;
  saving: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [text, setText] = useState(value);
  useEffect(() => { if (visible) setText(value); }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>Edit {label}</Text>
          <TextInput
            style={[styles.modalInput, multiline && styles.modalInputMultiline]}
            value={text}
            onChangeText={setText}
            multiline={multiline}
            autoFocus
            placeholderTextColor="#555"
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSaveBtn, saving && { opacity: 0.5 }]}
              onPress={() => onSave(text)}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveText}>Save</Text>
              }
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PasswordModal({
  visible, onCancel, onSave, saving, styles,
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: (password: string) => void;
  saving: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    if (visible) {
      setNewPw('');
      setConfirmPw('');
    }
  }, [visible]);

  const handleSave = () => {
    if (newPw.length < 8) { Alert.alert('Too short', 'Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    onSave(newPw);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput style={styles.modalInput} value={newPw} onChangeText={setNewPw}
            placeholder="New password" placeholderTextColor="#555" secureTextEntry autoFocus />
          <TextInput style={styles.modalInput} value={confirmPw} onChangeText={setConfirmPw}
            placeholder="Confirm password" placeholderTextColor="#555" secureTextEntry />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.modalSaveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveText}>Save</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SettingsRow({ label, value, onPress, dim, styles }: {
  label: string; value?: string | null; onPress: () => void; dim?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}>
      <Text style={styles.settingsRowLabel}>{label}</Text>
      <View style={styles.settingsRowRight}>
        <Text style={[styles.settingsRowValue, dim && { color: styles.settingsRowChevron.color }]} numberOfLines={1}>
          {value ?? '—'}
        </Text>
        <Text style={styles.settingsRowChevron}>›</Text>
      </View>
    </Pressable>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

type BlockedUser = {
  id: number;
  username: string;
  full_name: string;
};

export default function Settings() {
  const { preference, setPreference, colors: C, resolved } = useAppTheme();
  const { profile, user, role, signOut, refreshProfile } = useAuth();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  const [editModal, setEditModal] = useState<{
    field: string; label: string; value: string; multiline?: boolean;
  } | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [blockedModal, setBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingBlocked(true);
    try {
      const { data: rows, error: bErr } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', profile.id);
      if (bErr) throw bErr;
      const ids = (rows ?? []).map((r: any) => r.blocked_id);
      if (ids.length === 0) { setBlockedUsers([]); return; }
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, username, full_name')
        .in('id', ids);
      if (uErr) throw uErr;
      setBlockedUsers(users ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingBlocked(false);
    }
  }, [profile?.id]);

  const handleUnblock = async (targetId: number) => {
    if (!profile?.id) return;
    setUnblockingId(targetId);
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', profile.id)
        .eq('blocked_id', targetId);
      if (error) throw error;
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUnblockingId(null);
    }
  };

  const initials = profile?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const openEdit = (field: string, label: string, value: string, multiline?: boolean) =>
    setEditModal({ field, label, value, multiline });

  const handleSaveField = async (value: string) => {
    if (!editModal || !profile) return;
    setSaving(true);
    try {
      if (editModal.field === 'email') {
        const { error } = await supabase.auth.updateUser({ email: value });
        if (error) throw error;
        Alert.alert('Check your inbox', `A confirmation link was sent to ${value}.`);
        setEditModal(null);
        return;
      }
      const { error } = await supabase.from('users').update({ [editModal.field]: value }).eq('uid', profile.uid);
      if (error) throw error;
      await refreshProfile(profile.uid);
      setEditModal(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
      if (error) throw error;
      setPasswordModal(false);
      Alert.alert('Done', 'Password updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to change your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !profile) return;

    setUploadingPhoto(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop() ?? 'jpg';
      const fileName = `${profile.uid}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri, name: fileName, type: `image/${ext}` } as any);
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, formData, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('uid', profile.uid);
      if (updateError) throw updateError;
      await refreshProfile(profile.uid);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <SlideScreen index={3}>
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarWrapper}>
            {profile?.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            }
            {uploadingPhoto && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </Pressable>
          <Pressable onPress={handlePickPhoto} style={{ marginTop: 8 }}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
          <Text style={styles.profileName}>{profile?.full_name ?? '—'}</Text>
          <Text style={styles.profileUsername}>@{profile?.username ?? '—'}</Text>
          {role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Profile */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label="Username" value={profile?.username}
            onPress={() => openEdit('username', 'Username', profile?.username ?? '')} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="Name" value={profile?.full_name}
            onPress={() => openEdit('full_name', 'Full Name', profile?.full_name ?? '')} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="Bio" value={profile?.bio ?? 'Add a bio'}
            onPress={() => openEdit('bio', 'Bio', profile?.bio ?? '', true)}
            dim={!profile?.bio} styles={styles} />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label="Email" value={user?.email}
            onPress={() => openEdit('email', 'Email', user?.email ?? '')} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="Phone" value={profile?.phone_number ?? 'Add phone number'}
            onPress={() => openEdit('phone_number', 'Phone Number', profile?.phone_number ?? '')}
            dim={!profile?.phone_number} styles={styles} />
          <View style={styles.rowDivider} />
          <SettingsRow label="Password" value="Change password"
            onPress={() => setPasswordModal(true)} styles={styles} />
        </View>

        {/* Theme */}
        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.sectionCard}>
          <View style={[styles.settingsRow, { paddingVertical: 12 }]}>
            <View style={styles.themeSelector}>
              {THEME_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[styles.themeOption, preference === opt.value && styles.themeOptionActive]}
                  onPress={() => setPreference(opt.value)}
                >
                  <Text style={[styles.themeOptionText, preference === opt.value && styles.themeOptionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.sectionCard}>
          <Pressable
            onPress={() => { setBlockedModal(true); loadBlockedUsers(); }}
            style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.settingsRowLabel}>Blocked Users</Text>
            <View style={styles.settingsRowRight}>
              <Text style={styles.settingsRowChevron}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOutButton, { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <EditFieldModal
        visible={!!editModal} label={editModal?.label ?? ''} value={editModal?.value ?? ''}
        multiline={editModal?.multiline} onCancel={() => setEditModal(null)}
        onSave={handleSaveField} saving={saving} styles={styles}
      />
      <PasswordModal
        visible={passwordModal} onCancel={() => { setPasswordModal(false); setSaving(false); }}
        onSave={handleSavePassword} saving={saving} styles={styles}
      />

      {/* Blocked Users Modal */}
      <Modal visible={blockedModal} transparent animationType="slide" onRequestClose={() => setBlockedModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setBlockedModal(false)}>
          <Pressable style={[styles.blockedModalContent]} onPress={() => {}}>
            <View style={styles.blockedModalHeader}>
              <Text style={styles.modalTitle}>Blocked Users</Text>
              <Pressable onPress={() => setBlockedModal(false)} hitSlop={8}>
                <Text style={{ color: C.accent, fontSize: 16, fontWeight: '500' }}>Done</Text>
              </Pressable>
            </View>
            {loadingBlocked ? (
              <ActivityIndicator color={C.accent} style={{ paddingVertical: 40 }} />
            ) : blockedUsers.length === 0 ? (
              <View style={styles.blockedEmptyState}>
                <Text style={styles.blockedEmptyText}>You haven't blocked anyone.</Text>
              </View>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={u => String(u.id)}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => (
                  <View style={styles.blockedRow}>
                    <View style={styles.blockedAvatar}>
                      <Text style={styles.blockedAvatarText}>
                        {item.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.blockedName}>{item.full_name}</Text>
                      <Text style={styles.blockedUsername}>@{item.username}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleUnblock(item.id)}
                      disabled={unblockingId === item.id}
                      style={({ pressed }) => [styles.unblockBtn, (pressed || unblockingId === item.id) && { opacity: 0.6 }]}
                    >
                      {unblockingId === item.id
                        ? <ActivityIndicator color={C.accent} size="small" />
                        : <Text style={styles.unblockBtnText}>Unblock</Text>
                      }
                    </Pressable>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
    </SlideScreen>
  );
}
