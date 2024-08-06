import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ToastAndroid,
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

interface FriendRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  friendRequests: string[];
}

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  visible,
  onClose,
  friendRequests,
}) => {
  const { user, setUser } = useAuthStore();

  const handleAccept = async (requesterId: string) => {
    try {
      onClose();
      const userRef = doc(db, "users", user.id);
      const requesterRef = doc(db, "users", requesterId);
      const conversationId = [user.id, requesterId].sort().join("_");

      // Update the current user's document
      await updateDoc(userRef, {
        friendRequests: arrayRemove(requesterId),
        friendList: arrayUnion(requesterId),
        conversations: arrayUnion(conversationId),
      });

      // Update the requester's document
      await updateDoc(requesterRef, {
        friendList: arrayUnion(user.id),
        conversations: arrayUnion(conversationId),
      });

      // Create a new conversation document
      const conversationRef = doc(db, "conversations", conversationId);
      await setDoc(conversationRef, {
        participants: [user.id, requesterId],
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });

      // Update the local state
      setUser({
        ...user,
        friendRequests: user.friendRequests.filter(
          (id: string) => id !== requesterId
        ),
        friendList: [...user.friendList, requesterId],
        conversations: [...user.conversations, conversationId],
      });

      ToastAndroid.showWithGravityAndOffset(
        "Friend request accepted",
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
        0,
        100
      );
    } catch (e) {
      console.error("Error accepting friend request: ", e);
    }
  };

  const handleReject = async (requesterId: string) => {
    try {
      onClose();
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        friendRequests: arrayRemove(requesterId),
      });
      setUser({
        ...user,
        friendRequests: user.friendRequests.filter(
          (id: string) => id !== requesterId
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
            <Text>Friend Requests</Text>
            {friendRequests.map((requesterId) => (
              <View key={requesterId} style={styles.requestContainer}>
                <Text>{requesterId}</Text>
                <Button
                  title="Accept"
                  onPress={() => handleAccept(requesterId)}
                />
                <Button
                  title="Reject"
                  onPress={() => handleReject(requesterId)}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={onClose}>
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
    backgroundColor: "#444444",
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
  },
  button: {
    backgroundColor: "#6a0dad",
    padding: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
  },
});

export default FriendRequestsModal;