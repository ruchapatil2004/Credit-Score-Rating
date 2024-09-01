document.addEventListener('DOMContentLoaded', () => {
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const chatbotClose = document.querySelector('.chatbot-close');
    const chatbotIcon = document.querySelector('.chatbot-icon');
    const chatbotSend = document.querySelector('.chatbot-send');
    const chatbotInput = document.querySelector('.chatbot-input input');
    const chatbotContent = document.querySelector('.chatbot-content');
    // const chatbotInput = document.querySelector('.score-label');
    const suggestion = document.querySelector('.suggestion');



    if (!chatbotContainer || !chatbotWindow || !chatbotClose || !chatbotIcon || !chatbotSend || !chatbotInput || !chatbotContent) {
        console.error('One or more chatbot elements not found');
        return;
    }

    chatbotIcon.addEventListener('click', () => {
        chatbotWindow.style.display = 'flex';
    });

    chatbotClose.addEventListener('click', (event) => {
        event.stopPropagation();
        chatbotWindow.style.display = 'none';
    });

    const sendMessage = async () => {
        const message = chatbotInput.value.trim();
        if (!message) return;

        console.log('Sending message:', message);
        chatbotContent.innerHTML += `<div class="user-message" style="font-weight: bold;text-align:right">${message}</div>`;
        chatbotInput.value = '';
        chatbotContent.scrollTop = chatbotContent.scrollHeight;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemini-pro',
                    contents: message ,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const md = markdownit();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop();
                for (const chunk of chunks) {
                    if (chunk.startsWith('data: ')) {
                        const data = JSON.parse(chunk.slice(5));
                        chatbotContent.innerHTML += md.render(data.text);
                        chatbotContent.scrollTop = chatbotContent.scrollHeight;
                    }
                }
            }
        } catch (e) {
            console.error('Error:', e);
            chatbotContent.innerHTML += `<div class="error-message">Error: ${e.message}</div>`;
            scrollToBottom();  // Scroll down to the new message
        }
    };

    chatbotSend.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('ai').style.display = 'none';
    const tips = async () => {
        msg = document.getElementById('ai').innerHTML;
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemini-pro',
                    contents: msg + "calculate my risk analysis percetnage according to this data and give the report in rupees" ,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const md = markdownit();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop();
                for (const chunk of chunks) {
                    if (chunk.startsWith('data: ')) {
                        const data = JSON.parse(chunk.slice(5));
                        suggestion.innerHTML += md.render(data.text);
                        suggestion.scrollTop = suggestion.scrollHeight;
                    }
                }
            }
        } catch (e) {
            console.error('Error:', e);
            chatbotContent.innerHTML += `<div class="error-message">Error: ${e.message}</div>`;
            scrollToBottom();  // Scroll down to the new message
        }
    };
    document.getElementById('tip').addEventListener('click', tips);
});


