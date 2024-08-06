import { Button, StyleSheet, Text, View, ImageBackground, Image, ActivityIndicator, Animated } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  GoogleSignin,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../context/AuthStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const index = () => {
  const { user, setUser, error, setError } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  let [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const letterAnimations = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = letterAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -10,
            duration: 300,
            delay: index * 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.stagger(300, animations).start();
  }, [letterAnimations]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "273478545786-931rvm9f6guf3iufrh8fd7bo3ve948iv.apps.googleusercontent.com",
    });
  }, [user]);

  const signin = async () => {
    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const userId = userInfo.user.id;

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setUser(userDoc.data());
        router.replace("/chats");
      } else {
        setUser({
          id: userId,
          name: userInfo.user.name,
          email: userInfo.user.email,
        });
        router.replace("/registration");
      }

      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!fontsLoaded || isSigningIn) {
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
    <ImageBackground
      source={require('../assets/images/Purple Gradient iPhone Wallpaper HD.jpg')}
      style={styles.container}
      onLayout={onLayoutRootView}
    >
      <Text>{error ? error.toString() : ""}</Text>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/chat-conversation-svgrepo-com.png')}
          style={styles.logo}
        />
        <View style={styles.appNameContainer}>
          <Text style={styles.welcomeText}>Welcome to </Text>
          {["C", "h", "a", "t", "e", "y", "!"].map((letter, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.appName,
                { transform: [{ translateY: letterAnimations[index] }] },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Dark}
          onPress={signin}
        />
      </View>

      <StatusBar style="auto" />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  appNameContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  appName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },
  welcomeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
  },
});

export default index;