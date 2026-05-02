import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs'
import { useAuth } from '@/components/auth-context'
import { useColorScheme } from 'react-native'
import { Colors } from '@/constants/theme'

export default function AppLayout() {
  const { role } = useAuth()
  const scheme = useColorScheme()
  const C = Colors[scheme ?? 'light']

  return (
    <NativeTabs
      backgroundColor={C.background}
      indicatorColor={C.backgroundElement}
      labelStyle={{ selected: { color: C.text } }}>

      <NativeTabs.Trigger name="map/index">
        <Label>Map</Label>
        <Icon src={require('@/assets/images/map-icon.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings/index">
        <Label>Settings</Label>
        <Icon src={require('@/assets/images/settings-icon.png')} />
      </NativeTabs.Trigger>

      {role === 'admin' && (
        <NativeTabs.Trigger name="admin-panel/index">
          <Label>Admin</Label>
          <Icon src={require('@/assets/images/database-icon.png')} />
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  )
}