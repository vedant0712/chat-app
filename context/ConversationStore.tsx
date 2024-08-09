import { create } from 'zustand';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: any;
}

interface ConversationState {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  fetchConversations: (userId: string) => void;
  createConversation: (user1Id: string, user2Id: string) => Promise<string>;
}

export const useConversationStore = create<ConversationState>()((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  fetchConversations: async (userId: string): Promise<void> => {
    const conversationsRef = collection(db, "conversations");
    const conversationsSnapshot = await getDocs(conversationsRef);
    const conversations = conversationsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
      .filter(conversation => conversation.participants.includes(userId));
    set({ conversations });
  },
  createConversation: async (user1Id, user2Id) => {
    const conversationId = [user1Id, user2Id].sort().join("_");
    const conversationRef = doc(db, "conversations", conversationId);

    await updateDoc(conversationRef, {
      participants: arrayUnion(user1Id, user2Id),
      lastMessage: "",
      lastUpdated: serverTimestamp(),
    });

    return conversationId;
  },
}));