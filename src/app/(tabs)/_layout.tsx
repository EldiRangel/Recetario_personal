import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import { Icon, Icons } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICON_SIZE = 24;


export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Icon name={Icons.home} color={color as string} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recetas',
          tabBarIcon: ({ color }) => <Icon name={Icons.recipes} color={color as string} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          tabBarIcon: ({ color }) => <Icon name={Icons.groups} color={color as string} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Icon name={Icons.profile} color={color as string} size={TAB_ICON_SIZE} />,
        }}
      />
    </Tabs>
  );
}
