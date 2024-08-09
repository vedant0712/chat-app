import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground, ActivityIndicator, Image, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../context/AuthStore";
import { useMessageStore } from "../context/MessageStore";
import { useNavigation } from "@react-navigation/native";
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const Conversation = () => {
  const { conversationId, participantName } = useLocalSearchParams<{ conversationId: string; participantName: string }>();
  const { user } = useAuthStore();
  const { messages, sendMessage, loadMessages, cleanup } = useMessageStore();
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      await loadMessages(conversationId);
      setIsLoading(false);
    };
    load();

    return () => {
      cleanup(conversationId);
    };
  }, [conversationId, loadMessages, cleanup]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, [messages[conversationId]]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(conversationId, user.id, newMessage);
      setNewMessage("");
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return (
      <ImageBackground
        source={require('../assets/images/Purple Gradient iPhone Wallpaper HD.jpg')}
        style={styles.loadingContainer}
        onLayout={onLayoutRootView}
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </ImageBackground>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/Purple Gradient iPhone Wallpaper HD.jpg')}
        style={styles.background}
        onLayout={onLayoutRootView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../assets/images/back-arrows-svgrepo-com.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.participantName}>{participantName}</Text>
        </View>
        <View style={styles.separator} />
        <FlatList
          ref={flatListRef}
          data={messages[conversationId] || []}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[
              styles.messageContainer,
              item.senderId === user.id ? styles.sentMessage : styles.receivedMessage
            ]}>
              <View style={styles.messageContent}>
                <Text style={item.senderId === user.id ? styles.senderText : styles.receiverText}>
                  {item.content}
                </Text>
                {item.timestamp && item.timestamp.seconds ? (
                  <Text style={[
                    styles.timestamp,
                    item.senderId === user.id ? styles.senderTimestamp : styles.receiverTimestamp
                  ]}>
                    {new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : (
                  <Text style={styles.timestamp}></Text>
                )}
              </View>
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Image source={require('../assets/images/send-alt-1-svgrepo-com.png')} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  participantName: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: 'Poppins_700Bold',
    color: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderRadius: 10, 
    marginBottom: 10,
    padding: 10,
    maxWidth: '80%',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 10, 
    marginBottom: 10,
    padding: 10,
    maxWidth: '80%',
  },
  messageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderText: {
    fontFamily: 'Poppins_700Bold',
    color: 'black', 
  },
  receiverText: {
    fontFamily: 'Poppins_700Bold',
    color: 'white', 
  },
  timestamp: {
    fontSize: 10,
    marginLeft: 10,
    fontFamily: 'Poppins_700Bold',
  },
  senderTimestamp: {
    color: 'black', 
  },
  receiverTimestamp: {
    color: 'lightgray', 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 20,
    fontFamily: 'Poppins_700Bold',
    color: 'white',
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
});

export default Conversation;