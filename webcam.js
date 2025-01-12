// Initialize the webcam and set event listeners
function initializeWebcam() {
    const video = document.getElementById('webcam');
    if (!video) {
        console.error('Webcam element not found');
        appendToChatbox('Error: Webcam element not found.', true);
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('getUserMedia error:', error.message || error);
            appendToChatbox('Error initializing webcam: ' + (error.message || 'Unknown error'), true);
        });
}

// Function to capture image from webcam and process it
function captureImage() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const context = canvas?.getContext('2d');

    if (!video || !canvas || !context) {
        console.error('Video, canvas, or context element not found');
        appendToChatbox('Error: Video, canvas, or context element not found.', true);
        return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    processImage(base64Image);
}

// Send the image to the server for processing
function processImage(base64Image) {
    if (!base64Image) {
        appendToChatbox('Error: No image data to process.', true);
        return;
    }

    toggleLoader(true); // Show the loader

    fetch('process_image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    })
    .then(handleResponse)
    .catch(handleError);
}

// Handle the server response
function handleResponse(data) {
    toggleLoader(false); // Hide the loader

    if (data?.error) {
        console.error('Server error:', data.error);
        appendToChatbox(`Error: ${data.error}`, true);
        return;
    }

    const messageContent = data?.choices?.[0]?.message?.content || 'No response content.';
    appendToChatbox(messageContent);
}

// Handle any errors during fetch
function handleError(error) {
    toggleLoader(false); // Hide the loader
    console.error('Fetch error:', error.message || error);
    appendToChatbox(`Error: ${error.message || 'Unknown error occurred'}`, true);
}

// Toggle the visibility of the loader
function toggleLoader(show) {
    const loader = document.querySelector('.loader');
    if (!loader) {
        console.error('Loader element not found');
        return;
    }
    loader.style.display = show ? 'block' : 'none';
}

// Append messages to the chatbox
function appendToChatbox(message, isUserMessage = false) {
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) {
        console.error('Chatbox element not found');
        return;
    }

    const messageElement = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString(); // Get the current time as a string
    
    // Assign different classes based on the sender for CSS styling
    messageElement.className = isUserMessage ? 'user-message' : 'assistant-message';

    messageElement.innerHTML = `<div class="message-content">${message}</div>
                                <div class="timestamp">${timestamp}</div>`;
    if (chatbox.firstChild) {
        chatbox.insertBefore(messageElement, chatbox.firstChild);
    } else {
        chatbox.appendChild(messageElement);
    }
}

// Function to switch the camera source
function switchCamera() {
    const video = document.getElementById('webcam');
    let usingFrontCamera = true; // This assumes the initial camera is the user-facing one

    return function() {
        if (!video) {
            console.error('Video element not found');
            appendToChatbox('Error: Video element not found.', true);
            return;
        }

        // Toggle the camera type
        usingFrontCamera = !usingFrontCamera;
        const constraints = {
            video: { facingMode: (usingFrontCamera ? 'user' : 'environment') }
        };
        
        // Stop any previous stream
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // Start a new stream with the new constraints
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(error => {
                console.error('Error accessing media devices:', error.message || error);
                appendToChatbox('Error switching camera: ' + (error.message || 'Unknown error'), true);
            });
    };
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeWebcam();

    document.getElementById('capture')?.addEventListener('click', captureImage);
    document.getElementById('switch-camera')?.addEventListener('click', switchCamera());
});

