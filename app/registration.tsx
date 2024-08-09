import { Button, Image, TextInput, View, Text, StyleSheet, ImageBackground, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
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
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();

const registration = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [name, setName] = useState(user.name);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(false); 
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  useEffect(() => {
    if (user) {
      setAppIsReady(true);
    } else {
      router.replace("/");
    }
  }, [user]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImg(result.assets[0].uri);
    }
  };

  const handleRegistration = async () => {
    try {
      setLoadingRegistration(true); 
      let downloadURL = null;
      if (profileImg) {
        const response = await fetch(profileImg);
        const blob = await response.blob();
        const storage = getStorage(app);
        const storageRef = ref(storage, `profileImages/${user.id}`);
        await uploadBytesResumable(storageRef, blob);
        downloadURL = await getDownloadURL(storageRef);
      }
      const userRef = doc(db, "users", user.id);
      const updatedUser = {
        ...user,
        name: name,
        profileImg: downloadURL,
        friendList: [],
        friendRequests: [],
        conversations: [],
      };
      await setDoc(userRef, updatedUser);
      console.log("Updated user data:", updatedUser);
      setUser(updatedUser);
      router.replace("/chats");
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    } finally {
      setLoadingRegistration(false); 
    }
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
        <View style={styles.content}>
          <Text style={styles.heading}>Registration</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name:</Text>
            <TextInput
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="white"
            />
          </View>
          <View style={styles.imageContainer}>
            {profileImg ? (
              <Image
                source={{ uri: profileImg }}
                style={styles.image}
              />
            ) : (
              <Image
                source={require('../assets/images/profile-svgrepo-com.png')}
                style={styles.defaultImage}
              />
            )}
          </View>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick a profile picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRegistration}>
            {loadingRegistration ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Register!</Text>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50, 
  },
  content: {
    alignItems: "center",
    width: "80%",
  },
  heading: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "white",
    marginBottom: 5,
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    height: 40,
    borderColor: "white",
    borderWidth: 1,
    padding: 9,
    paddingLeft: 20, 
    borderRadius: 20,
    color: "white",
    fontFamily: 'Poppins_700Bold',
    textAlignVertical: 'center', 
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  defaultImage: {
    width: "90%",
    height: "90%",
    marginTop: 10,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 20,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});

export default registration;