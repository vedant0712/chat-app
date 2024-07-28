import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../context/AuthStore";
import AddFriendModal from "../components/AddFriendModal";
import FriendRequestsModal from "../components/FriendRequestsModal";
import { doc, getDoc } from "firebase/firestore";
import {
  useConversationStore,
  Conversation,
} from "../context/ConversationStore";
import { db } from "../config/firebase";

const Chats = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const { conversations, setConversations } = useConversationStore();

  useEffect(() => {
    if (user) {
      fetchConversationsData();
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
    }
  };

  const logout = async () => {
    try {
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
console.log(user,"user");
  return (
    user && (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.buttonText}>Add Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setRequestsModalVisible(true)}
          >
            <Text style={styles.buttonText}>
              Friend Requests ({user.friendRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Hello {user.name}!</Text>
        <AddFriendModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        <FriendRequestsModal
          visible={requestsModalVisible}
          onClose={() => setRequestsModalVisible(false)}
          friendRequests={user.friendRequests}
        />
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.conversationItem}>
              <Text style={styles.conversationText}>Conversation with {item.participants.filter(id => id !== user.id).join(", ")}</Text>
              <Text style={styles.conversationText}>Last Message: {item.lastMessage}</Text>
            </View>
          )}
        />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#333333", // Dark grey background
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#6a0dad", // Purple color
    padding: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
  },
  greeting: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
    color: "white", // White text for better contrast
  },
  conversationItem: {
    padding: 10,
    backgroundColor: "#444",
    marginVertical: 5,
    borderRadius: 5,
  },
  conversationText: {
    color: "white",
  },
});

export default Chats;