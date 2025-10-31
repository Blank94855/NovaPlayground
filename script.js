document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-area');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const menuButton = document.getElementById('menu-button');
    const newChatButton = document.getElementById('new-chat-button');
    const welcomeScreen = document.getElementById('welcome-screen');
    const modelDisplay = document.getElementById('model-display');
    const recentChatsList = document.getElementById('recent-chats-list');

    const bottomSheetContainer = document.getElementById('bottom-sheet-container');
    const bottomSheet = document.getElementById('bottom-sheet');
    const bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    const closeMenuButton = document.getElementById('close-menu-button');

    const modelPickerBtn = document.getElementById('model-picker-btn');
    const modelSelectDisplay = document.getElementById('model-select-display');
    const modelOptions = document.querySelectorAll('.model-option');
    const apiKeyBtn = document.getElementById('api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');
    const customPromptBtn = document.getElementById('custom-prompt-btn');
    const aboutBtn = document.getElementById('about-btn');
    const changelogBtn = document.getElementById('changelog-btn');
    const changelogContent = document.getElementById('changelog-content');
    const clearAllChatsBtn = document.getElementById('clear-all-chats-btn');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const examplePrompts = document.querySelectorAll('.example-prompt');

    const modalContainer = document.getElementById('modal-container');
    const apiKeyModal = document.getElementById('api-key-modal');
    const customPromptModal = document.getElementById('custom-prompt-modal');
    const modelPickerModal = document.getElementById('model-picker-modal');
    const aboutModal = document.getElementById('about-modal');

    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveCustomPromptBtn = document.getElementById('save-custom-prompt-btn');
    const customPromptInput = document.getElementById('custom-prompt-input');

    let chats = {};
    let activeChatId = null;
    let apiKey = '';
    let selectedModel = 'gemini-2.5-flash';
    let selectedModelName = 'Gemini 2.5 Flash';
    let customPrompt = '';
    let currentTheme = 'dark';
    let isGenerating = false;

    const converter = new showdown.Converter({
        ghCompatibleHeaderId: true,
        simpleLineBreaks: true,
        ghMentions: true,
        tables: true,
    });

    const setCookie = (name, value, days = 365) => {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    };

    const getCookie = (name) => {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    };

    const init = () => {
        loadSettings();
        if (!activeChatId || !chats[activeChatId]) {
            const sortedChats = Object.values(chats).sort((a, b) => b.lastUpdated - a.lastUpdated);
            if (sortedChats.length > 0) {
                activeChatId = sortedChats[0].id;
            } else {
                startNewChat(false);
            }
        }
        renderChatHistory();
        renderRecentChats();
        updateApiKeyStatus();
        updateUIFromSettings();

        if (!apiKey) {
            setTimeout(() => openModal(apiKeyModal), 500);
        }
    };

    const saveSettings = () => {
        localStorage.setItem('novaChats', JSON.stringify(chats));
        localStorage.setItem('novaActiveChatId', activeChatId);
        localStorage.setItem('novaApiKey', apiKey);
        localStorage.setItem('novaCustomPrompt', customPrompt);
        localStorage.setItem('novaTheme', currentTheme);
        
        setCookie('novaModel', selectedModel);
        setCookie('novaModelName', selectedModelName);
        setCookie('novaApiKey', apiKey);
        setCookie('novaTheme', currentTheme);
    };

    const loadSettings = () => {
        const storedChats = localStorage.getItem('novaChats');
        chats = storedChats ? JSON.parse(storedChats) : {};

        const storedActiveId = localStorage.getItem('novaActiveChatId');
        activeChatId = (storedActiveId && storedActiveId !== 'null') ? storedActiveId : null;

        apiKey = getCookie('novaApiKey') || localStorage.getItem('novaApiKey') || '';
        selectedModel = getCookie('novaModel') || localStorage.getItem('novaModel') || 'gemini-2.5-flash';
        selectedModelName = getCookie('novaModelName') || localStorage.getItem('novaModelName') || 'Gemini 2.5 Flash';
        customPrompt = localStorage.getItem('novaCustomPrompt') || '';
        currentTheme = getCookie('novaTheme') || localStorage.getItem('novaTheme') || 'dark';
    };

    const renderChatHistory = () => {
        const currentChat = chats[activeChatId];
        if(currentChat && currentChat.history.length > 0) {
            welcomeScreen.classList.add('hidden');
            chatArea.innerHTML = '';
            currentChat.history.forEach(msg => addMessageToUI(msg.role, msg.parts[0].text));
        } else {
             welcomeScreen.classList.remove('hidden');
             chatArea.innerHTML = '';
             chatArea.appendChild(welcomeScreen);
        }
        scrollToBottom();
    };

    const addMessageToUI = (role, text) => {
        welcomeScreen.classList.add('hidden');
        const isUser = role === 'user';
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-bubble flex items-start gap-3 md:gap-4 w-full ${isUser ? 'justify-end' : ''}`;

        const formattedText = converter.makeHtml(text);

        messageWrapper.innerHTML = `
            ${!isUser ? `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b61ff] to-[#9c88ff] flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>` : ''}
            <div class="message-content max-w-[85%] sm:max-w-[70%]">
                <div class="p-3 px-4 shadow-md ${isUser ? 'bg-gradient-to-br from-[#7b61ff] to-[#9c88ff] text-white rounded-t-2xl rounded-bl-2xl' : 'bg-[var(--surface-color)] text-[var(--text-color)] rounded-t-2xl rounded-br-2xl'}">
                    <div class="prose prose-sm max-w-none">${formattedText}</div>
                </div>
            </div>
            ${isUser ? `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b61ff] to-[#9c88ff] flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>` : ''}
            `;

        const proseEl = messageWrapper.querySelector('.prose');
        proseEl.style.color = 'currentColor';
        proseEl.querySelectorAll('p, li, h1, h2, h3, table').forEach(el => el.style.color = 'currentColor');
        chatArea.appendChild(messageWrapper);
    };

    const showTypingIndicator = () => {
         welcomeScreen.classList.add('hidden');
         const typingIndicator = document.createElement('div');
         typingIndicator.id = 'typing-indicator';
         typingIndicator.className = 'chat-bubble flex items-start gap-3 md:gap-4';
         typingIndicator.innerHTML = `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b61ff] to-[#9c88ff] flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div><div class="p-3 px-4 rounded-t-2xl rounded-br-2xl bg-[var(--surface-color)]"><div class="typing-indicator flex items-center space-x-1.5 h-[24px]"><span class="w-2 h-2 bg-[var(--text-muted-color)] rounded-full"></span><span class="w-2 h-2 bg-[var(--text-muted-color)] rounded-full"></span><span class="w-2 h-2 bg-[var(--text-muted-color)] rounded-full"></span></div></div>`;
         chatArea.appendChild(typingIndicator);
         scrollToBottom();
    }

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    const renderRecentChats = () => {
        recentChatsList.innerHTML = '';
        const sortedChats = Object.values(chats).sort((a, b) => b.lastUpdated - a.lastUpdated);

        if(sortedChats.length === 0){
            recentChatsList.innerHTML = `<p class="text-xs text-center text-[var(--text-muted-color)] p-4">No recent chats.</p>`;
            return;
        }

        sortedChats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `recent-chat-item flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-[var(--surface-light-color)] transition-colors group`;
            if (chat.id === activeChatId) {
                item.classList.add('active');
            }
            item.innerHTML = `<p class="text-sm truncate pr-2">${chat.title}</p>
            <button class="delete-chat-btn hidden group-hover:inline-block p-1 rounded-md hover:bg-red-500/20">
                <svg class="w-4 h-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002 2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
            </button>`;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-chat-btn')) return;
                switchChat(chat.id);
            });

            item.querySelector('.delete-chat-btn').addEventListener('click', () => {
                deleteChat(chat.id);
            });

            recentChatsList.appendChild(item);
        });
    };

    const switchChat = (chatId) => {
        if (chatId === activeChatId) return;
        activeChatId = chatId;
        saveSettings();
        renderChatHistory();
        renderRecentChats();
        toggleMenu(false);
    };

    const deleteChat = (chatId) => {
        delete chats[chatId];
        if (activeChatId === chatId) {
            const sortedChats = Object.values(chats).sort((a, b) => b.lastUpdated - a.lastUpdated);
            if (sortedChats.length > 0) {
                activeChatId = sortedChats[0].id;
                renderChatHistory();
            } else {
                startNewChat(false);
                renderChatHistory();
            }
        }
        saveSettings();
        renderRecentChats();
    };

    const updateApiKeyStatus = () => {
        if (apiKey) {
            apiKeyStatus.textContent = 'Set';
            apiKeyStatus.className = 'text-xs text-green-400 font-medium';
        } else {
            apiKeyStatus.textContent = 'Not Set';
            apiKeyStatus.className = 'text-xs text-red-400 font-medium';
        }
    }

    const updateUIFromSettings = () => {
        modelDisplay.textContent = selectedModelName;
        modelSelectDisplay.textContent = selectedModelName;
        customPromptInput.value = customPrompt;
        apiKeyInput.value = apiKey;
        document.documentElement.className = currentTheme;
        updateThemeButtons();
        updateModelButtons();
    }

    const updateThemeButtons = () => {
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });
    }

    const updateModelButtons = () => {
         modelOptions.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.model === selectedModel);
         });
    }

    const scrollToBottom = () => {
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    }

    const toggleMenu = (open) => {
        if(open) {
            renderRecentChats();
            bottomSheetContainer.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                bottomSheetContainer.style.opacity = '1';
                bottomSheet.classList.remove('sheet-closed');
                bottomSheet.classList.add('sheet-open');
            }, 10);
        } else {
            bottomSheetContainer.style.opacity = '0';
            bottomSheet.classList.add('sheet-closed');
            bottomSheet.classList.remove('sheet-open');
            setTimeout(() => {
                bottomSheetContainer.classList.add('hidden');
                 document.body.style.overflow = '';
            }, 350);
        }
    };

    const openModal = (modalElement) => {
        modalContainer.classList.remove('hidden');
        modalContainer.classList.add('flex');
        const modalWrapper = modalElement.parentElement;
        setTimeout(() => {
            modalContainer.classList.remove('opacity-0');
            modalWrapper.classList.remove('scale-95', 'opacity-0');
            modalElement.classList.remove('hidden');
        }, 10);
    };

    const closeModal = () => {
         const modalWrapper = modalContainer.querySelector('.modal-content-wrapper');
         if (modalWrapper) {
            modalWrapper.classList.add('scale-95', 'opacity-0');
         }
        modalContainer.classList.add('opacity-0');
        setTimeout(() => {
            modalContainer.classList.add('hidden');
            modalContainer.classList.remove('flex');
            document.querySelectorAll('.modal-content').forEach(m => m.classList.add('hidden'));
        }, 300);
    };

    const callGeminiApi = async () => {
        if (!apiKey) {
            addMessageToUI('model', 'Error: API Key not set. Please set it in the settings.');
            openModal(apiKeyModal);
            return;
        }
        if(isGenerating) return;
        isGenerating = true;

        sendButton.disabled = true;
        showTypingIndicator();

        const currentChat = chats[activeChatId];
        if(!currentChat) {
            isGenerating = false;
            return;
        }

        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

        const payload = { contents: currentChat.history };
        if (customPrompt) {
            payload.systemInstruction = { parts: [{ text: customPrompt }] };
        }

        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.candidates && data.candidates[0].content) {
                const aiText = data.candidates[0].content.parts[0].text;
                const aiMessage = { role: 'model', parts: [{ text: aiText }] };
                currentChat.history.push(aiMessage);
                currentChat.lastUpdated = Date.now();

                removeTypingIndicator();
                addMessageToUI(aiMessage.role, aiMessage.parts[0].text);
            } else {
                 throw new Error(data?.promptFeedback?.blockReason?.toString() || "No response from API. The prompt may have been blocked.");
            }

        } catch (error) {
            removeTypingIndicator();
            addMessageToUI('model', `API Error: ${error.message}`);
            console.error("API Error:", error);
        } finally {
            isGenerating = false;
            sendButton.disabled = false;
            messageInput.focus();
            saveSettings();
            renderRecentChats();
            scrollToBottom();
        }
    };

    const handleUserMessage = (text) => {
        const userMessageText = text.trim();
         if (userMessageText) {
            const currentChat = chats[activeChatId];
            if (!currentChat) return;

            if(currentChat.history.length === 0){
                currentChat.title = userMessageText.substring(0, 40) + (userMessageText.length > 40 ? '...' : '');
            }

            const userMessage = { role: 'user', parts: [{ text: userMessageText }] };
            currentChat.history.push(userMessage);
            currentChat.lastUpdated = Date.now();

            addMessageToUI(userMessage.role, userMessage.parts[0].text);
            messageInput.value = '';
            messageInput.style.height = '52px';
            scrollToBottom();
            callGeminiApi();
            saveSettings();
            renderRecentChats();
        }
    }

    const startNewChat = (render = true) => {
        const newChatId = Date.now().toString();
        chats[newChatId] = { id: newChatId, title: 'New Chat', history: [], lastUpdated: Date.now() };
        activeChatId = newChatId;
        saveSettings();
        if(render){
            renderChatHistory();
            renderRecentChats();
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleUserMessage(messageInput.value);
    });

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        let newHeight = Math.min(160, messageInput.scrollHeight);
        messageInput.style.height = newHeight + 'px';
    });

     messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    examplePrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            const mainText = btn.querySelector('p:first-child').textContent;
            const subText = btn.querySelector('p:last-child').textContent;
            handleUserMessage(`${mainText} ${subText}`);
        });
    });

    newChatButton.addEventListener('click', () => {
        startNewChat();
    });

    menuButton.addEventListener('click', () => toggleMenu(true));
    closeMenuButton.addEventListener('click', () => toggleMenu(false));
    bottomSheetOverlay.addEventListener('click', () => toggleMenu(false));

    apiKeyBtn.addEventListener('click', () => openModal(apiKeyModal));
    customPromptBtn.addEventListener('click', () => openModal(customPromptModal));
    modelPickerBtn.addEventListener('click', () => {
        toggleMenu(false);
        setTimeout(() => openModal(modelPickerModal), 350);
    });
    aboutBtn.addEventListener('click', () => {
        toggleMenu(false);
        setTimeout(() => openModal(aboutModal), 350);
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', closeModal));

    saveApiKeyBtn.addEventListener('click', () => {
        apiKey = apiKeyInput.value.trim();
        updateApiKeyStatus();
        saveSettings();
        closeModal();
    });

    saveCustomPromptBtn.addEventListener('click', () => {
        customPrompt = customPromptInput.value.trim();
        saveSettings();
        closeModal();
    });

    modelOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedModel = btn.dataset.model;
            selectedModelName = btn.dataset.name;
            updateUIFromSettings();
            saveSettings();
            closeModal();
        });
    });

    changelogBtn.addEventListener('click', () => {
        changelogContent.classList.toggle('hidden');
        changelogBtn.textContent = changelogContent.classList.contains('hidden') ? 'Show Changelog' : 'Hide Changelog';
    });

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentTheme = btn.dataset.theme;
            document.documentElement.className = currentTheme;
            updateThemeButtons();
            saveSettings();
        });
    });

    clearAllChatsBtn.addEventListener('click', () => {
        chats = {};
        startNewChat();
        toggleMenu(false);
    });

    init();
});


