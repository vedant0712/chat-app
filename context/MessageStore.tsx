import { create } from 'zustand';
import { db } from '../config/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, updateDoc } from "firebase/firestore";

interface Message {
  senderId: string;
  content: string;
  timestamp: any;
}

interface MessageState {
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, senderId: string, content: string) => void;
  loadMessages: (conversationId: string) => void;
  cleanup: (conversationId: string) => void;
  clearMessages: () => void; 
}

export const useMessageStore = create<MessageState>((set) => {
  const listeners: Record<string, () => void> = {};

  return {
    messages: {},
    sendMessage: async (conversationId, senderId, content) => {
      const message = {
        senderId,
        content,
        timestamp: serverTimestamp(),
      };

      const messagesRef = collection(db, "messages", conversationId, "messages");
      await addDoc(messagesRef, message);

      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: content,
        lastUpdated: serverTimestamp(),
      });

      console.log(`Message sent: ${content}`); 
    },
    loadMessages: (conversationId: string) => { 
      if (listeners[conversationId]) {
        return;
      }

      const messagesRef = collection(db, "messages", conversationId, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data() as Message);
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: messages,
          },
        }));
        console.log(`Messages loaded for conversation ${conversationId}:`, messages); 
      });

      listeners[conversationId] = unsubscribe;
    },
  
    cleanup: (conversationId: string) => { 
      if (listeners[conversationId]) {
        listeners[conversationId]();
        delete listeners[conversationId];
      }
    },
    clearMessages: () => {
      set({ messages: {} });
    },
  };
});