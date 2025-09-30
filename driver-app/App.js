import React from "react";
import { Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider } from "react-redux";
import { store } from "./src/store/store";

// Import screens
import DashboardScreen from "./src/screens/DashboardScreen";
import ActiveRidesScreen from "./src/screens/ActiveRidesScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import RideDetailsScreen from "./src/screens/RideDetailsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Dashboard flow
function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{
          title: "NELA Driver",
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
            letterSpacing: -0.3,
          },
        }}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{
          title: "Ride Details",
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Active Rides flow
function ActiveRidesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActiveRidesMain"
        component={ActiveRidesScreen}
        options={{
          title: "Active Rides",
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
        }}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{
          title: "Ride Details",
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#94a3b8",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height: 65,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
          borderTopWidth: 0,
          paddingHorizontal: 15,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 5,
          paddingVertical: 8,
        },
        tabBarActiveBackgroundColor: "#10b981",
        tabBarInactiveBackgroundColor: "transparent",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => {
            return React.createElement(
              Text,
              {
                style: {
                  fontSize: 20,
                  color: focused ? "#ffffff" : color,
                  marginBottom: 2,
                },
              },
              "🏠"
            );
          },
        }}
      />
      <Tab.Screen
        name="ActiveRides"
        component={ActiveRidesStack}
        options={{
          tabBarLabel: "Rides",
          tabBarIcon: ({ color, focused }) => {
            return React.createElement(
              Text,
              {
                style: {
                  fontSize: 20,
                  color: focused ? "#ffffff" : color,
                  marginBottom: 2,
                },
              },
              "🚗"
            );
          },
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          title: "Earnings",
          tabBarLabel: "Earnings",
          tabBarIcon: ({ color, focused }) => {
            return React.createElement(
              Text,
              {
                style: {
                  fontSize: 20,
                  color: focused ? "#ffffff" : color,
                  marginBottom: 2,
                },
              },
              "💰"
            );
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => {
            return React.createElement(
              Text,
              {
                style: {
                  fontSize: 20,
                  color: focused ? "#ffffff" : color,
                  marginBottom: 2,
                },
              },
              "⚙️"
            );
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: "#475569",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#f1f5f9",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </Provider>
  );
}
