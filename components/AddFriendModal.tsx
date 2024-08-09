import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ToastAndroid,
} from "react-native";
import {
  doc,
  getDocs,
  updateDoc,
  arrayUnion,
  collection,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuthStore } from "../context/AuthStore";
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState<string>("");

  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  const sendFriendRequest = async () => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; email: string }[];
  
      const matchedUser = users.find(
        (u: { email: string }) => u.email === email
      );
      if (matchedUser) {
        const matchedUserRef = doc(db, "users", matchedUser.id);
        await updateDoc(matchedUserRef, {
          friendRequests: arrayUnion({
            id: user.id,
            name: user.name,
            profileImg: user.profileImg,
          }),
        });
        ToastAndroid.showWithGravity(
          "Friend request sent",
          ToastAndroid.SHORT,
          ToastAndroid.TOP
        );
        onClose();
      } else {
        ToastAndroid.showWithGravity(
          "Incorrect email entered",
          ToastAndroid.SHORT,
          ToastAndroid.TOP
        );
      }
    } catch (e) {
      console.error("Error sending friend request: ", e);
      ToastAndroid.showWithGravity(
        "Error sending friend request",
        ToastAndroid.LONG,
        ToastAndroid.TOP
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Add Friend</Text>
          <TextInput
            placeholder="Enter friend's email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="rgba(0, 0, 0, 0.5)" // Placeholder text color
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.sendButton} onPress={sendFriendRequest}>
              <Text style={styles.buttonText}>Send!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: "100%",
    fontFamily: 'Poppins_700Bold', 
    color: "black", 
    borderRadius: 20, 
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  sendButton: {
    backgroundColor: "#6a0dad",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    flex: 1,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: 'Poppins_700Bold', 
  },
  closeButtonText: {
    color: "white",
    fontFamily: 'Poppins_700Bold', 
  },
  title: {
    fontFamily: 'Poppins_700Bold', 
    fontSize: 20,
    color: "black",
    marginBottom: 20,
  },
});

export default AddFriendModal;