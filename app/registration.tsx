import { Button, Image, TextInput, View, Text, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../context/AuthStore";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { db, app } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

const registration = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [name, setName] = useState(user.name);
  const [profileImg, setProfileImg] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImg(result.assets[0].uri);
    }
  };

  const handleRegistration = async () => {
    try {
      let downloadURL = null;

      if (profileImg) {
        // Fetch the image as a blob
        const response = await fetch(profileImg);
        const blob = await response.blob();
        // Initialize Firebase Storage
        const storage = getStorage(app);
        const storageRef = ref(storage, `profileImages/${user.id}`);
        // Upload the image
        await uploadBytesResumable(storageRef, blob);
        // Get the download URL
        downloadURL = await getDownloadURL(storageRef);
        router.replace("/chats");
      }
      // Get a reference to Firestore
      const userRef = doc(db, "users", user.id); // Use the user's ID as the document ID
      // Set the user data in Firestore
      await setDoc(userRef, {
        ...user,
        name: name,
        profileImg: downloadURL, // This will be null if no image was uploaded
        friendList: [],
        friendRequests: [],
      });
      setUser({
        ...user,
        name: name,
        profileImg: downloadURL,
        friendList: [],
        friendRequests: [],
      });
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  };

  return (
    user && (
      <View>
        <View>
          <Text>Name</Text>
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
          <Button title="Pick a profile picture" onPress={pickImage} />
          {profileImg && (
            <Image
              source={{ uri: profileImg }}
              style={{
                width: 200,
                height: 200,
                borderWidth: 1,
                borderColor: "red",
              }}
            />
          )}
          <Button title="Register" onPress={handleRegistration} />
        </View>
      </View>
    )
  );
};

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//   },
//   input: {
//     height: 40,
//     margin: 12,
//     borderWidth: 1,
//     padding: 10,
//     width: "100%",
//   },
//   image: {
//     width: 200,
//     height: 200,
//     margin: 20,
//   },
// });

export default registration;
