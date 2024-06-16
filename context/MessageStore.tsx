import { create } from 'zustand';
import { db } from '../config/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

interface Message {
  senderId: string;
  content: string;
  timestamp: any;
}

interface MessageState {
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, senderId: string, content: string) => void;
  loadMessages: (conversationId: string) => void;
}

export const useMessageStore = create<MessageState>()((set) => ({
  messages: {},
  sendMessage: async (conversationId, senderId, content) => {
    const message = {
      senderId,
      content,
      timestamp: serverTimestamp(),
    };

    const messagesRef = collection(db, "messages", conversationId, "messages");
    await addDoc(messagesRef, message);

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    }));
  },
  loadMessages: (conversationId) => {
    const messagesRef = collection(db, "messages", conversationId, "messages");

    onSnapshot(messagesRef, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as Message);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messages,
        },
      }));
    });
  },
}));