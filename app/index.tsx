import { Button, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  GoogleSignin,
  GoogleSigninButton,
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { useAuthStore } from "../context/AuthStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const index = () => {
  const { user, setUser, error, setError } = useAuthStore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "273478545786-931rvm9f6guf3iufrh8fd7bo3ve948iv.apps.googleusercontent.com",
    });
  }, [user]);

  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const userId = userInfo.user.id;

      // Check if the user already exists in Firestore
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // User already exists, set user from Firestore and redirect to chats
        setUser(userDoc.data());
        router.replace("/chats");
      } else {
        // User does not exist, set user from Google Sign-In info and redirect to registration
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
    }
  };

  return (
    <View style={styles.container}>
      <Text>{error ? error.toString() : ""}</Text>
      <View>
        <Text>Welcome to Chat!</Text>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Dark}
          onPress={signin}
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default index;
