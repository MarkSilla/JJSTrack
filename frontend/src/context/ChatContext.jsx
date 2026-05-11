import React, { createContext, useState, useCallback } from 'react'

export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const value = {
    isOpen,
    openChat,
    closeChat,
    toggleChat
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = React.useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
