// Chat Widget Logic
let chatState = { mode: 'normal' };

function toggleChat() {
    document.getElementById('chatWidget').classList.toggle('active');
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}

function sendQuickReply(text) {
    const inputField = document.getElementById('chatInput');
    inputField.value = text;
    sendChatMessage();
}

async function sendChatMessage() {
    const inputField = document.getElementById('chatInput');
    const message = inputField.value.trim();
    if(!message) return;

    // Remove predefined options if they exist
    const optionsDiv = document.getElementById('chatOptions');
    if(optionsDiv) optionsDiv.style.display = 'none';

    appendMessage('user', message);
    inputField.value = '';

    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight;

    const typingId = 'typing-' + Date.now();
    appendTypingIndicator(typingId);

    try {
        const response = await fetch('https://mini-banking-backend.onrender.com/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        const data = await response.json();
        
        removeTypingIndicator(typingId);
        
        if(response.ok) {
            appendMessage('bot', data.response);
        } else {
            appendMessage('bot', 'Error: Failed to process your request.');
        }
    } catch(error) {
        removeTypingIndicator(typingId);
        appendMessage('bot', 'Network error. Please make sure the backend server is running.');
    }
}

function appendMessage(sender, text) {
    const chatBody = document.getElementById('chatBody');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.innerHTML = `<p>${text}</p>`;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function appendTypingIndicator(id) {
    const chatBody = document.getElementById('chatBody');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message bot typing-indicator`;
    msgDiv.id = id;
    msgDiv.innerHTML = `<p>Processing your request <span class="dots"><span></span><span></span><span></span></span></p>`;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if(indicator) indicator.remove();
}
