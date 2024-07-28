import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { useRoute,RouteProp } from "@react-navigation/native";
import { useAuthStore } from "../context/AuthStore";
import { useMessageStore } from "../context/MessageStore";

type ConversationRouteParams = {
    conversationId: string;
    participantName: string;
  };
  
const Conversation = () => {
    const route = useRoute<RouteProp<{ params: ConversationRouteParams }, 'params'>>();
    const { conversationId, participantName } = route.params;
  const { user } = useAuthStore();
  const { messages, sendMessage, loadMessages } = useMessageStore();
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(conversationId, user.id, newMessage);
      setNewMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with {participantName}</Text>
      <FlatList
        data={messages[conversationId] || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <Text style={styles.messageSender}>{item.senderId === user.id ? "You" : participantName}</Text>
            <Text style={styles.messageContent}>{item.content}</Text>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Type a message"
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  messageItem: {
    marginBottom: 10,
  },
  messageSender: {
    fontWeight: "bold",
  },
  messageContent: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
});

export default Conversation;