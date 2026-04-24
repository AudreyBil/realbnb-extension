document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const messageDiv = document.getElementById('message');

  // Load saved API key, if any
  const {apiKey} = await chrome.storage.local.get('apiKey');
  if (apiKey) {
    // Show only the first few and last few characters of the API key for
    // security
    const maskedKey =
        apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
    apiKeyInput.value = maskedKey;
    apiKeyInput.setAttribute('data-has-saved-key', 'true');
  }

  // When the input field is clicked and has a saved key, clear it so user can
  // enter a new one
  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.getAttribute('data-has-saved-key') === 'true') {
      apiKeyInput.value = '';
      apiKeyInput.removeAttribute('data-has-saved-key');
    }
  });

  // Save the API key when the button is clicked
  saveButton.addEventListener('click', async () => {
    const newApiKey = apiKeyInput.value.trim();

    // Validate the API key - basic check for OpenAI format
    if (!newApiKey) {
      showMessage('Please enter an API key.', 'error');
      return;
    }

    if (!newApiKey.startsWith('sk-')) {
      showMessage('API key should start with "sk-".', 'error');
      return;
    }

    try {
      // Store the new key in local storage
      await chrome.storage.local.set({apiKey: newApiKey});

      // Mask the key in the input field
      const maskedKey = newApiKey.substring(0, 6) + '...' +
          newApiKey.substring(newApiKey.length - 4);
      apiKeyInput.value = maskedKey;
      apiKeyInput.setAttribute('data-has-saved-key', 'true');

      showMessage('API key saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving API key:', error);
      showMessage('Error saving API key. Please try again.', 'error');
    }
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
  }
});
