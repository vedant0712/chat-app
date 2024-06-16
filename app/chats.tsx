import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../context/AuthStore";
import AddFriendModal from "../components/AddFriendModal";
import FriendRequestsModal from "../components/FriendRequestsModal";

const Chats = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user]);

  const logout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUser(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  };
  return (
    user && (
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>Add Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setRequestsModalVisible(true)}>
            <Text style={styles.buttonText}>Friend Requests ({user.friendRequests.length})</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Hello {user.name}!</Text>
        <AddFriendModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        <FriendRequestsModal
          visible={requestsModalVisible}
          onClose={() => setRequestsModalVisible(false)}
          friendRequests={user.friendRequests}
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "80%", // Make the modal bigger
    backgroundColor: "#444444", // Slightly lighter dark grey for modal
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Chats;