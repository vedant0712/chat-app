import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Conversation } from "../context/ConversationStore";

interface ConversationListProps {
  conversations: Conversation[];
  user: any;
  loadingConversations: boolean;
  handleConversationPress: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  user,
  loadingConversations,
  handleConversationPress,
}) => {
  if (loadingConversations) {
    return (
      <View style={styles.noConversationsContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.noConversationsContainer}>
        <Text style={styles.noConversationsText}>
          Add friends to start a conversation!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ width: "100%" }}
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        if (!item.participants) {
          return null;
        }
        const participant = item.participants.find((id) => id !== user?.id);
        const participantData = user.friendList.find(
          (friend: { id: string }) => friend.id === participant
        );
        const participantName = participantData ? participantData.name : "Unknown";
        const participantImage = participantData ? participantData.profileImg : null;
        return (
          <TouchableOpacity onPress={() => handleConversationPress(item)}>
            <View style={styles.conversationItem}>
              {participantImage && (
                <Image source={{ uri: participantImage }} style={styles.participantImage} />
              )}
              <View style={styles.conversationTextContainer}>
                <Text style={styles.conversationText}>{participantName}</Text>
                <Text style={styles.lastMessageText}>{item.lastMessage}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  noConversationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noConversationsText: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
  },
  conversationItem: {
    width: 350,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    marginVertical: 5,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  participantImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  conversationTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  conversationText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    textAlign: "left",
    fontSize: 20,
  },
  lastMessageText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    textAlign: "left",
    marginTop: 0.5,
  },
});

export default ConversationList;