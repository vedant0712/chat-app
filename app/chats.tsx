import { View, Text, StyleSheet, TouchableOpacity, FlatList, ImageBackground, Image, ActivityIndicator, Animated } from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../context/AuthStore";
import AddFriendModal from "../components/AddFriendModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  useConversationStore,
  Conversation,
} from "../context/ConversationStore";
import { db } from "../config/firebase";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const Chats = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const { conversations, setConversations } = useConversationStore();
  const [appIsReady, setAppIsReady] = useState(false);
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const slideAnim = useRef(new Animated.Value(-40)).current; // Start behind the logo
  const opacityAnim = useRef(new Animated.Value(0)).current; // Start invisible

  const handleLogoPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -40,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const slideStyle = {
    transform: [{ translateX: slideAnim }],
    opacity: opacityAnim,
  };

  useEffect(() => {
    if (user) {
      fetchConversationsData();
      const userRef = doc(db, "users", user.id);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUser(doc.data());
          fetchConversationsData();
        }
      });

      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    } else {
      router.replace("/");
    }
  }, [user]);

  const fetchConversationsData = async () => {
    if (user) {
      // Fetch conversations based on user's conversation IDs
      const conversationPromises = user.conversations.map(async (conversationId: string) => {
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        return { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
      });
  
      const conversations = await Promise.all(conversationPromises);
      setConversations(conversations);
      setAppIsReady(true);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  const logout = async () => {
    try {
      await SplashScreen.preventAutoHideAsync(); // Show splash screen
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUser(null);
      router.replace("/"); // Redirect to login page after logout
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    const participantName = conversation.participants.find(id => id !== user?.id);
    router.push({
      pathname: "/conversation",
      params: { conversationId: conversation.id, participantName: participantName || "Unknown" },
    });
  };

  if (!appIsReady || !fontsLoaded || user === null) {
    return (
      <ImageBackground
        source={require('../assets/images/Purple Gradient iPhone Wallpaper HD.jpg')}
        style={styles.container}
        onLayout={onLayoutRootView}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </ImageBackground>
    );
  }

  return (
    user && (
      <ImageBackground
        source={require('../assets/images/Purple Gradient iPhone Wallpaper HD.jpg')}
        style={styles.container}
        onLayout={onLayoutRootView}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Image
              source={require('../assets/images/chat-conversation-svgrepo-com.png')}
              style={styles.logo}
            />
          </TouchableOpacity>
          <Animated.Text style={[styles.appName, slideStyle]}>Chatey!</Animated.Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={logout}>
              <Image
                source={require('../assets/images/shut-down-1431-svgrepo-com.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(true)}
            >
              <Image
                source={require('../assets/images/add-friend-svgrepo-com.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setRequestsModalVisible(true)}
            >
              <Image
                source={require('../assets/images/notification-bell-svgrepo-com.png')}
                style={styles.icon}
              />
              {user.friendRequests.length > 0 && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.greetingContainer}>
          <Image
            source={{ uri: user.profileImg }}
            style={styles.profileImage}
          />
          <View style={styles.greetingTextContainer}>
            <Text style={styles.helloText}>Hello</Text>
            <Text style={styles.greeting}>{user.name}!</Text>
          </View>
        </View>
        <AddFriendModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        <FriendRequestsModal
          visible={requestsModalVisible}
          onClose={() => setRequestsModalVisible(false)}
          friendRequests={user.friendRequests || []}
        />
        {conversations.length === 0 ? (
          <View style={styles.noConversationsContainer}>
            <Text style={styles.noConversationsText}>Add friends to start a conversation!</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              item.participants && <TouchableOpacity onPress={() => handleConversationPress(item)}>
                <View style={styles.conversationItem}>
                  <Text style={styles.conversationText}>
                    Conversation with {item.participants.filter(id => id !== user?.id).join(", ")}
                  </Text>
                  <Text style={styles.conversationText}>Last Message: {item.lastMessage}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ImageBackground>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 40, // Adjust the width as needed
    height: 40, // Adjust the height as needed
  },
  appName: {
    position: "absolute",
    left: 50, // Adjust the left position as needed
    color: "white",
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Faint white background with opacity
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF", // White text
    fontSize: 12,
  },
  icon: {
    width: 24, // Adjust the width as needed
    height: 24, // Adjust the height as needed
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center", // Center the greeting container
  },
  greetingTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: 10, // Add margin to the left of the text container
  },
  profileImage: {
    width: 60, // Increased size
    height: 60, // Increased size
    borderRadius: 30, // Rounded circle border
  },
  helloText: {
    fontSize: 16, // Slightly larger font size for "Hello"
    color: "rgba(255, 255, 255, 0.7)", // Translucent white text
    fontFamily: 'Poppins_700Bold',
    marginBottom: -10, // Reduce the gap between "Hello" and the name
  },
  greeting: {
    fontSize: 24, // Increased size for the name
    color: "white", // White text for better contrast
    fontFamily: 'Poppins_700Bold',
  },
  conversationItem: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Faint white background with opacity
    borderColor: "white", // White border
    borderWidth: 1,
    marginVertical: 5,
    borderRadius: 5,
  },
  conversationText: {
    color: "white",
    fontFamily: 'Poppins_700Bold',
  },
  noConversationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConversationsText: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.5)', // Translucent white text
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
});

export default Chats;