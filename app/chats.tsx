import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Image,
  ActivityIndicator,
  Animated,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../context/AuthStore";
import AddFriendModal from "../components/AddFriendModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import { doc, onSnapshot } from "firebase/firestore";
import {
  useConversationStore,
  Conversation,
} from "../context/ConversationStore";
import { db } from "../config/firebase";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useMessageStore } from "../context/MessageStore"; 
import ConversationList from "../components/ConversationList";

SplashScreen.preventAutoHideAsync();

const Chats = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const { conversations, setConversations, fetchConversations } =
    useConversationStore();
  const { clearMessages } = useMessageStore(); 
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const slideAnim = useRef(new Animated.Value(-40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
    if (!user) return;
    const userRef = doc(db, "users", user.id);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      setUser(doc.data());
    });
    return () => unsubscribe();
  }, [user?.friendRequests.length]);

  useEffect(() => {
    if (user) {
      setLoadingConversations(true);
      Promise.resolve(fetchConversations(user.id)).finally(() => {
        setLoadingConversations(false);
        setAppIsReady(true);
      });
    } else {
      router.replace("/");
    }
  }, [user]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  const logout = async () => {
    try {
      await SplashScreen.preventAutoHideAsync();
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUser(null);
      setConversations([]);
      clearMessages(); 
      router.replace("/");
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    const participant = conversation.participants.find((id) => id !== user?.id);
    const participantData = user.friendList.find(
      (friend: { id: string }) => friend.id === participant
    );
    const participantName = participantData ? participantData.name : "Unknown";
    router.push({
      pathname: "/conversation",
      params: { conversationId: conversation.id, participantName },
    });
  };

  if (!appIsReady || !fontsLoaded || user === null) {
    return (
      <ImageBackground
        source={require("../assets/images/Purple Gradient iPhone Wallpaper HD.jpg")}
        style={styles.container}
        onLayout={onLayoutRootView}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </ImageBackground>
    );
  }

  if (!user) {
    router.replace("/");
  }
  console.log(conversations, "conversations");
  return (
    user && (
      <ImageBackground
        source={require("../assets/images/Purple Gradient iPhone Wallpaper HD.jpg")}
        style={styles.container}
        onLayout={onLayoutRootView}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleLogoPress}>
            <Image
              source={require("../assets/images/chat-conversation-svgrepo-com.png")}
              style={styles.logo}
            />
          </TouchableOpacity>
          <Animated.Text style={[styles.appName, slideStyle]}>
            Chatey!
          </Animated.Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={logout}>
              <Image
                source={require("../assets/images/shut-down-1431-svgrepo-com.png")}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(true)}
            >
              <Image
                source={require("../assets/images/add-friend-svgrepo-com.png")}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setRequestsModalVisible(true)}
            >
              <Image
                source={require("../assets/images/notification-bell-svgrepo-com.png")}
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
        <ConversationList
          conversations={conversations}
          user={user}
          loadingConversations={loadingConversations}
          handleConversationPress={handleConversationPress}
        />
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
    width: 40,
    height: 40,
  },
  appName: {
    position: "absolute",
    left: 50,
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
  },
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
    marginBottom: 10,
  },
  greetingTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  helloText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "Poppins_700Bold",
    marginBottom: -10,
  },
  greeting: {
    fontSize: 24,
    color: "white",
    fontFamily: "Poppins_700Bold",
  },
  participantImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  conversationItem: {
    width: 350,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    marginVertical: 5,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  conversationTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  conversationText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    textAlign: "left",
    fontSize: 20,
  },
  lastMessageText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    textAlign: "left",
    marginTop: 0.5,
  },
  noConversationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noConversationsText: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
});

export default Chats;
