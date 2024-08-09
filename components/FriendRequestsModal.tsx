import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ToastAndroid,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuthStore } from "../context/AuthStore";
import { useFonts, Poppins_700Bold } from "@expo-google-fonts/poppins";

interface FriendRequest {
  id: string;
  name: string;
  profileImg: string;
}

interface FriendRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  friendRequests: FriendRequest[];
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  visible,
  onClose,
  friendRequests,
}) => {
  const { user, setUser } = useAuthStore();
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      setLoading(false);
    }
  }, [fontsLoaded]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleAccept = async (requesterId: string) => {
    try {
      onClose();
      const userRef = doc(db, "users", user.id);
      const requesterRef = doc(db, "users", requesterId);
      const conversationId = [user.id, requesterId].sort().join("_");

      const requesterData = user.friendRequests.find(
        (request: FriendRequest) => request.id === requesterId
      );

      if (!requesterData) {
        throw new Error("Requester data not found");
      }

      // Optimistically update local state

      await updateDoc(userRef, {
        friendRequests: arrayRemove(requesterData),
        friendList: arrayUnion(requesterData),
        conversations: arrayUnion(conversationId),
      });

      await updateDoc(requesterRef, {
        friendList: arrayUnion({
          id: user.id,
          name: user.name,
          profileImg: user.profileImg,
        }),
        conversations: arrayUnion(conversationId),
      });

      const conversationRef = doc(db, "conversations", conversationId);
      await setDoc(conversationRef, {
        participants: [user.id, requesterId],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });

      const updatedUser = {
        ...user,
        friendRequests: user.friendRequests.filter(
          (request: FriendRequest) => request.id !== requesterId
        ),
        friendList: [...user.friendList, requesterData],
        conversations: [...user.conversations, conversationId],
      };
      setUser(updatedUser);

      ToastAndroid.showWithGravityAndOffset(
        "Friend request accepted",
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        100
      );
    } catch (e) {
      setUser({
        ...user,
        friendRequests: user.friendRequests,
        friendList: user.friendList,
        conversations: user.conversations,
      });
      console.error("Error accepting friend request: ", e);
    }
  };

  const handleReject = async (requesterId: string) => {
    try {
      onClose();
      const userRef = doc(db, "users", user.id);
      const requesterData = user.friendRequests.find(
        (request: FriendRequest) => request.id === requesterId
      );

      if (!requesterData) {
        throw new Error("Requester data not found");
      }

      await updateDoc(userRef, {
        friendRequests: arrayRemove(requesterData),
      });

      setUser({
        ...user,
        friendRequests: user.friendRequests.filter(
          (request: FriendRequest) => request.id !== requesterId
        ),
      });

      ToastAndroid.showWithGravityAndOffset(
        "Friend request rejected",
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        100
      );
    } catch (e) {
      console.error("Error rejecting friend request: ", e);
    }
  };

  return (
    friendRequests && (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.title}>Friend Requests</Text>
            {friendRequests.map((request) => (
              <View key={request.id} style={styles.requestContainer}>
                <Text style={styles.text}>{request.name}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(request.id)}
                  >
                    <Image
                      source={require("../assets/images/check-circle-svgrepo-com.png")}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(request.id)}
                  >
                    <Image
                      source={require("../assets/images/basic-denied-reject-svgrepo-com.png")}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
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
  requestContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 10,
    alignItems: "center",
    backgroundColor: "black",
    padding: 10,
    borderRadius: 10,
  },
  text: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  acceptButton: {
    borderRadius: 20,
    marginRight: 5,
    alignItems: "center",
  },
  rejectButton: {
    borderRadius: 20,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "black",
  },
  icon: {
    width: 24,
    height: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FriendRequestsModal;
