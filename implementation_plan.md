I need you to implement the "Real-Time Chat," "Media Channels," and "Message Management" features for my Discord Clone project. This corresponds to the segment of the tutorial video (Code With Antonio) from timestamp 08:08:39 to the end.

My backend socket routes (`pages/api/socket/...`) appear to be partially scaffolded, but I need you to build the frontend logic, hooks, and UI components to make the chat functional and real-time.

Please follow this implementation roadmap:

### Phase 1: Real-Time Infrastructure & Hooks
1.  **Dependencies**: Ensure the following packages are installed/available:
    * `socket.io-client`, `@tanstack/react-query`, `query-string`, `date-fns`
    * `emoji-mart`, `@emoji-mart/react`, `@emoji-mart/data`
    * `livekit-server-sdk`, `livekit-client`, `@livekit/components-react`, `@livekit/components-styles`
2.  **Socket Provider**: Verify or create `components/providers/socket-provider.tsx` to handle the client-side Socket.io connection.
3.  **Socket Indicator**: Create `components/socket-indicator.tsx` to show connection status (Live/Polling).
4.  **Custom Hooks**:
    * `hooks/use-chat-socket.ts`: Listen for socket events (`addKey`, `updateKey`) and update the React Query cache instantly for real-time feedback.
    * `hooks/use-chat-query.ts`: Handle infinite scrolling and fetching messages using `useInfiniteQuery`.
    * `hooks/use-chat-scroll.ts`: Manage auto-scrolling to the bottom on new messages and loading older messages when scrolling up.

### Phase 2: Chat Components
1.  **Chat Welcome**: Create `components/chat/chat-welcome.tsx` to display the "Welcome to #channel" header.
2.  **Chat Input**: Create `components/chat/chat-input.tsx`.
    * Implement a form using `react-hook-form` and `zod`.
    * Include an **Emoji Picker** (using `emoji-mart`) in a Popover.
    * Handle file uploads (modals are likely already setup, ensure integration).
    * Post data to the correct API endpoint (`/api/socket/messages` or `/api/socket/direct-messages`).
3.  **Chat Item**: Create `components/chat/chat-item.tsx`.
    * Display individual messages with user avatar, name, timestamp, and role icon.
    * Handle **PDF/Image rendering** based on file type.
    * Implement **Editing** (switch to input mode) and **Deleting** (trigger confirm modal).
    * Apply conditional rendering for "Guest", "Moderator", and "Admin" permissions.
4.  **Chat Messages**: Create `components/chat/chat-messages.tsx`.
    * Bring it all together: Render the list of `ChatItem` components.
    * Implement the infinite scroll div using `useChatScroll`.

### Phase 3: Media Rooms (Video/Audio)
1.  **LiveKit Setup**:
    * Create the token route at `app/api/livekit/route.ts` using `livekit-server-sdk`.
2.  **Media Room Component**:
    * Create `components/media-room.tsx` using `@livekit/components-react`.
    * It should handle connecting to a room based on `chatId`.
3.  **Integration**:
    * Update `app/(main)/servers/[serverId]/channels/[channelId]/page.tsx` to render `MediaRoom` if the channel type is `AUDIO` or `VIDEO`.

### Phase 4: Final Integration
1.  **Channel Page**: Update `app/(main)/servers/[serverId]/channels/[channelId]/page.tsx` to use `ChatMessages` and `ChatInput` for TEXT channels.
2.  **Conversation Page**: Update `app/(main)/servers/[serverId]/conversations/[memberId]/page.tsx` to use the same components but pointing to the direct message API routes.

**Context from my codebase:**
* I have `pages/api/socket/io.ts` and message routes.
* I have `components/chat/chat-header.tsx`.
* My schema includes `Message`, `DirectMessage`, `Channel`, and `Member`.

Please start by checking my existing `pages/api/socket` routes to ensure they match the requirements for the hooks, then proceed to Phase 1.