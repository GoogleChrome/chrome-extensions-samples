document.addEventListener('DOMContentLoaded', () => {
  const messageList = document.getElementById('message-list');

  const sampleMessages = [
    { type: 'received', text: '', isAudio: true, audioSrc: 'intro.mp3' },
    { type: 'sent', text: "I'm in a meeting right now" },
    { type: 'received', text: '', isAudio: true, audioSrc: 'msg1.mp3' },
    { type: 'sent', text: '🙄' }
  ];

  async function renderMessages() {
    messageList.innerHTML = ''; // Clear existing messages
    let delay = 0; // Initial delay
    const delayIncrement = 3000; // 5 seconds in milliseconds

    await timeout(3000);

    sampleMessages.forEach(async (msg, index) => {
      // Use setTimeout to delay the appearance of each message
      setTimeout(async () => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', msg.type);

        // Add a class for fade-in animation (optional, but nice)
        messageElement.style.opacity = '0'; // Start transparent
        messageElement.style.transition = 'opacity 0.5s ease-in-out';

        if (msg.isAudio && msg.audioSrc) {
          messageElement.classList.add('audio');

          // Create audio element (hidden controls)
          const audioElement = document.createElement('audio');
          audioElement.preload = 'metadata'; // Important for getting duration
          const sourceElement = document.createElement('source');
          sourceElement.type = 'audio/mpeg'; // Assuming MP3
          audioElement.appendChild(sourceElement);

          const response = await fetch(msg.audioSrc);
          const data = await response.arrayBuffer();
          const blob = new Blob([data], { type: 'audio/wav' });
          sourceElement.src = URL.createObjectURL(blob);
          // Keep the audio element in the DOM but hidden for playback logic
          audioElement.style.display = 'none';
          messageElement.appendChild(audioElement);

          // Create custom controls container
          const controlsContainer = document.createElement('div');
          controlsContainer.classList.add('audio-controls');

          // Play/Pause Button
          const playPauseButton = document.createElement('button');
          playPauseButton.classList.add('audio-play-pause');
          playPauseButton.textContent = '▶'; // Play icon initially
          controlsContainer.appendChild(playPauseButton);

          // Progress Bar (Slider)
          const progressBar = document.createElement('input');
          progressBar.type = 'range';
          progressBar.classList.add('audio-progress');
          progressBar.value = 0;
          progressBar.min = 0;
          progressBar.max = 100; // Will be updated with duration
          progressBar.step = 0.1;
          controlsContainer.appendChild(progressBar);

          // Duration Display
          const durationDisplay = document.createElement('span');
          durationDisplay.classList.add('audio-duration');
          durationDisplay.textContent = '0:00'; // Initial display
          controlsContainer.appendChild(durationDisplay);

          // Append custom controls to the message element
          messageElement.appendChild(controlsContainer);

          // --- Event Listeners for Custom Controls ---

          // Format time helper function
          function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
          }

          // Update duration when metadata loads
          audioElement.addEventListener('loadedmetadata', () => {
            progressBar.max = audioElement.duration;
            durationDisplay.textContent = formatTime(audioElement.duration);
          });

          // Play/Pause functionality
          playPauseButton.addEventListener('click', () => {
            if (audioElement.paused) {
              audioElement.play();
              playPauseButton.textContent = '❚❚'; // Pause icon
            } else {
              audioElement.pause();
              playPauseButton.textContent = '▶'; // Play icon
            }
          });

          // Update progress bar as audio plays
          audioElement.addEventListener('timeupdate', () => {
            progressBar.value = audioElement.currentTime;
            // Update duration display to show current time while playing (optional)
            durationDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
          });

          // Seek audio when progress bar is changed
          progressBar.addEventListener('input', () => {
            audioElement.currentTime = progressBar.value;
          });

          // Reset button to play when audio ends
          audioElement.addEventListener('ended', () => {
            playPauseButton.textContent = '▶';
            progressBar.value = 0; // Reset progress bar
          });
        } else {
          messageElement.textContent = msg.text;
          // Check if the message is emoji-only
          if (isEmojiOnly(msg.text)) {
            messageElement.classList.add('message-emoji-only');
          }
        }

        messageList.appendChild(messageElement);

        // Trigger the fade-in effect
        requestAnimationFrame(() => {
          // Ensures the element is in the DOM before changing opacity
          messageElement.style.opacity = '1';
        });

        // Scroll to the bottom after adding the message
        messageList.scrollTop = messageList.scrollHeight;
      }, index * delayIncrement); // Stagger delay based on index
    });
  }

  // Helper function to check if a string contains only emojis
  function isEmojiOnly(str) {
    // Regex to match one or more emojis and nothing else
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u;
    return emojiRegex.test(str.trim());
  }

  renderMessages();

  // Basic send functionality (optional, just for demo)
  const sendButton = document.getElementById('send-button'); // Use ID selector
  const messageInput = document.getElementById('message-input-field'); // Use ID selector

  function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
      // No need to re-render everything, just add the new message
      const newMessage = { type: 'sent', text: text };
      sampleMessages.push(newMessage); // Add to data source

      // Create and append the new message element directly
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', 'sent');
      messageElement.textContent = text;

      // Check if the new message is emoji-only
      if (isEmojiOnly(text)) {
        messageElement.classList.add('message-emoji-only');
      }

      // Add fade-in effect (optional, consistent with renderMessages)
      messageElement.style.opacity = '0';
      messageElement.style.transition = 'opacity 0.5s ease-in-out';

      messageList.appendChild(messageElement);

      // Trigger fade-in
      requestAnimationFrame(() => {
        messageElement.style.opacity = '1';
      });

      // Scroll to bottom
      messageList.scrollTop = messageList.scrollHeight;

      messageInput.value = ''; // Clear input
    }
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Chat switching functionality
  const chatList = document.getElementById('chat-list');
  const chatItems = chatList.querySelectorAll('.chat-item');
  const currentChatName = document.getElementById('current-chat-name');
  const currentChatAvatar = document.getElementById('current-chat-avatar');

  chatItems.forEach((item) => {
    item.addEventListener('click', () => {
      // Remove active class from previously active item
      const currentActive = chatList.querySelector('.chat-item.active');
      if (currentActive) {
        currentActive.classList.remove('active');
      }

      // Add active class to clicked item
      item.classList.add('active');

      // Update chat header
      const chatName = item.querySelector('span:not(.avatar)').textContent; // Get name span specifically
      const avatarEmoji = item.querySelector('.avatar').textContent; // Get emoji from avatar span

      currentChatName.textContent = chatName;
      currentChatAvatar.textContent = avatarEmoji; // Set emoji in header avatar span
    });
  });
});

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
