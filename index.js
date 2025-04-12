const READ_CLASS = 'read';
const RUNNING_STATE_ID = 'running-state';
const MIN_TO_SHOW = 3;
const MAX_TO_SHOW = 10;
const THRESHOLD_CONSECUTIVE_CONVERSATIONS_EMPTY = 20;
const CONVERSATION_TITLE_SELECTOR = '.conversation.selected .conversation-title';
const SCROLLER_SELECTOR = 'infinite-scroller';
const INITIALIZE_TIMEOUT = 1500;
const TIMER_INTERVAL = 250;

function extractText(element) {
    let text = '';

    // Iterate over child nodes
    for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            // If it's a text node, append its text content
            text += child.textContent + ' ';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            // If it's an element node, recursively extract text from its children
            text += extractText(child);
        }
    }

    return text;
}

function getConversationsRead() {
    return Array.from(scroller.querySelectorAll(`.conversation-container.${READ_CLASS}`));
}
function getConversationsUnread() {
    return Array.from(scroller.querySelectorAll(`.conversation-container:not(.${READ_CLASS})`));
}

function handleScrolling() {
    if (scroller) {
        // If scroll is already on top, scroll down and up to force reload again
        if (scroller.scrollTop <= 0) {
            scroller.scrollTop = 25;
        }

        scroller.scrollTop = 0;
    }
    else {
        console.error('Scroller not found');
    }
}

function handleHiding() {
    console.log('Handling hiding...');

    const conversationsRead = getConversationsRead();
    const conversationsUnread = getConversationsUnread();

    // Set loaded conversation from scroller as read
    if (window.scroller && conversationsUnread.length > 0) {
        console.log('Settings conversations as read:', conversationsUnread.length, '...');

        window.consecutiveConversationsEmpty = 0;
        
        for (const conversation of conversationsUnread) {
            // Add class read
            conversation.classList.add(READ_CLASS);
        }

        console.log('Finished settings conversations as read:', conversationsUnread.length);
    }
    else {
        console.log('No conversations to read');
        window.consecutiveConversationsEmpty++;
    }

    // Disable on finish
    if (window.consecutiveConversationsEmpty >= THRESHOLD_CONSECUTIVE_CONVERSATIONS_EMPTY) {
        console.log('Finished, disabling handler');
        window.enabled = false;
    }

    // Hide conversations from end
    if (conversationsRead.length > MAX_TO_SHOW) {
        for (let i = conversationsRead.length - 1; i >= MIN_TO_SHOW; i--) {
            conversationsRead[i].style.display = 'none';
        }
    }

    console.log('Handling hiding finish', 'conversations read:', conversationsRead.length, 'conversations unread:', conversationsUnread.length);
}

function getChatTitle() {
    return document.querySelector(CONVERSATION_TITLE_SELECTOR)?.textContent?.trim() || 'New Chat';
}

function getChat() {
    const title = getChatTitle();
    const conversations = getConversationsRead().map(conversation => {
        const userQuery = conversation.querySelector('.user-query-container');
        const reponse = conversation.querySelector('.response-content');

        return {
            query: extractText(userQuery),
            response: extractText(reponse)
        };
    }); 
    
    return {
        title: title,
        chat: conversations
    }
}

async function copyChatToClipbaord() {
    try {
        const chat = getChat();
        await navigator.clipboard.writeText(JSON.stringify(chat));        
        const message = `Chat copied to clipboard: ${chat.title}`;

        // Show dialog
        alert(message);

        console.log(message);
    }
    catch (error) {
        console.error('Error copying chat to clipboard', error);
    }
}

function appendElements() {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.right = '10%';
    div.style.zIndex = '9999';
    div.style.padding = '10px';
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    div.style.color = 'white';
    div.style.borderRadius = '5px';

    const switchButton = createButton('Start/Stop', () => {
        window.enabled = !window.enabled;
        document.getElementById(RUNNING_STATE_ID).checked = window.enabled;
    });
    div.appendChild(switchButton);

    // Running state indicator read only checkbox
    const runningState = document.createElement('input');
    runningState.type = 'checkbox';
    runningState.id = RUNNING_STATE_ID;
    runningState.readOnly = true;
    div.appendChild(runningState);
    // Reset checked on click
    runningState.addEventListener('click', (e) => {
        e.preventDefault();
        runningState.checked = window.enabled;        
    });

    const copyChatToClipboardButton = createButton('Get Chat', async () => {
        await copyChatToClipbaord();
    });
    div.appendChild(copyChatToClipboardButton);

    document.body.appendChild(div);
}

function createButton(text, handler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '5px 10px';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'transparent';
    button.style.color = 'white';
    button.addEventListener('click', (e) => {
        e.preventDefault();
        handler();
    });

    return button;
}

function startHandler() {
    console.log('Starting handler...');

    setInterval(() => {
        if (window.enabled) {
            console.log('Handler running...');

            handleScrolling();
            handleHiding();

            console.log('Handler finished');
        }
        else {
            console.log('Handler not running - disabled');
        }

        document.getElementById(RUNNING_STATE_ID).checked = window.enabled;
    }, TIMER_INTERVAL);

    console.log('Handler started');
}


(function () {
    'use strict';

    window.onload = async () => {
        console.log('Initializing...');

        console.log('Waiting initialization interval...');
        await new Promise(resolve => setTimeout(resolve, INITIALIZE_TIMEOUT));
        console.log('Initialization interval finished, continuing...');

        window.enabled = false;
        window.scroller = document.querySelector(SCROLLER_SELECTOR);
        window.consecutiveConversationsEmpty = 0;

        startHandler();
        appendElements();

        console.log('Initialized');
    }
})();