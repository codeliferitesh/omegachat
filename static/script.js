const socket = io();
let currentRoom = '';
let username = '';
let adminUser = '';

// DOM Elements
const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const appDiv = document.querySelector('.app');
const loadingScreen = document.getElementById('loadingScreen');
const roomCodeEl = document.getElementById('roomCode');
const usersCountEl = document.getElementById('usersCount');
const messagesEl = document.getElementById('messages');
const typingEl = document.getElementById('typingIndicator');
const messageInput = document.getElementById('messageInput');
const imageInput = document.getElementById('imageInput');
const destroyBtn = document.getElementById('destroyBtn');
const themeToggle = document.getElementById('themeToggle');

// ===== LOADING SCREEN =====
window.addEventListener('load', () => setTimeout(hideLoadingScreen, 1000));
function hideLoadingScreen() {
    loadingScreen.style.transition = 'opacity 0.6s';
    loadingScreen.style.opacity = 0;
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        appDiv.classList.remove('hidden');
    }, 600);
}

// ===== THEME SWITCH =====
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
});

// ===== CREATE ROOM =====
function createRoom() {
    username = document.getElementById('username').value.trim();
    if (!username) return alert('Enter username');
    socket.emit('create_room', { username });
}

socket.on('room_created', data => {
    currentRoom = data.code;
    adminUser = data.admin;
    destroyBtn.classList.remove('hidden'); // Only admin can see destroy button
    joinRoomWithCode(currentRoom);
});

// ===== JOIN ROOM =====
function joinRoom() {
    username = document.getElementById('username').value.trim();
    const room = document.getElementById('roomInput').value.trim();
    if (!username || !room) return alert('Enter username and room code');
    currentRoom = room;
    joinRoomWithCode(room);
}

function joinRoomWithCode(room) {
    socket.emit('join_room', { room, username });
    loginDiv.classList.add('hidden');
    chatDiv.classList.remove('hidden');
    roomCodeEl.textContent = `Room: ${room}`;
    messageInput.focus();
    if(username === adminUser) destroyBtn.classList.remove('hidden');
}

// ===== LEAVE ROOM =====
function leaveRoom() {
    socket.emit('leave_room', { room: currentRoom, username });
    loginDiv.classList.remove('hidden');
    chatDiv.classList.add('hidden');
    messagesEl.innerHTML = '';
    currentRoom = '';
    adminUser = '';
}

// ===== DESTROY ROOM =====
function destroyRoom() {
    if(!confirm("Are you sure you want to destroy this room?")) return;
    socket.emit('destroy_room', { room: currentRoom, username });
}

// ===== SEND MESSAGE =====
function sendMessage() {
    const msg = messageInput.value.trim();
    if (!msg) return;
    socket.emit('send_message', { room: currentRoom, user: username, msg });
    addMessage(username, msg, true);
    messageInput.value = '';
    messageInput.focus();
}

// ===== ENTER KEY SEND =====
messageInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
        e.preventDefault();
        sendMessage();
    }
});

// ===== TYPING INDICATOR =====
let typingTimeout;
messageInput.addEventListener('input', () => {
    socket.emit('typing', { room: currentRoom, username });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => typingEl.innerHTML = '', 1500);
});

// ===== SEND IMAGE =====
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        socket.emit('send_image', { room: currentRoom, user: username, data: reader.result });
        addMessage(username, reader.result, true, true);
    };
    reader.readAsDataURL(file);
});

// ===== RECEIVE MESSAGES =====
socket.on('message', data => {
    if (data.user !== username) addMessage(data.user, data.msg);
});

socket.on('image', data => {
    if (data.user !== username) addMessage(data.user, data.data, false, true);
});

// ===== UPDATE USERS COUNT =====
socket.on('update_users', count => {
    usersCountEl.textContent = `${count} Members`;
});

// ===== TYPING FIRE ANIMATION =====
socket.on('typing', name => {
    typingEl.innerHTML = `${name} is typing `;
    for(let i = 0; i < 3; i++){
        const span = document.createElement('span');
        span.textContent = '🔥';
        span.classList.add('fire');
        typingEl.appendChild(span);
    }
    setTimeout(() => { typingEl.innerHTML = ''; }, 1500);
    messagesEl.scrollTop = messagesEl.scrollHeight;
});

// ===== ROOM DESTROYED =====
socket.on('room_destroyed', data => {
    alert(`Room "${data.room}" has been destroyed by admin!`);
    loginDiv.classList.remove('hidden');
    chatDiv.classList.add('hidden');
    messagesEl.innerHTML = '';
    currentRoom = '';
    adminUser = '';
});
// Code Written and Compiled By Ritesh @codeliferitesh
// You Can Thank Him For Projects AND Code
// Be Helpful, Be Happy, as God is always saving us from many problems 😚😎

// ===== ADD MESSAGE BUBBLES =====
function addMessage(user, msg, me=false, isImage=false) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    if(me) bubble.classList.add('me');
    if(isImage) {
        const img = document.createElement('img');
        img.src = msg;
        bubble.appendChild(img);
    } else {
        bubble.textContent = msg;
    }
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}
function addMessage(user, msg, me=false, isImage=false) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    if(me) bubble.classList.add('me');

    if(isImage) {
        // Show username above the image
        const nameEl = document.createElement('div');
        nameEl.textContent = user;
        nameEl.style.fontWeight = '600';
        nameEl.style.fontSize = '12px';
        nameEl.style.marginBottom = '4px';
        bubble.appendChild(nameEl);

        const img = document.createElement('img');
        img.src = msg;
        bubble.appendChild(img);
    } else {
        // Show username above text
        const nameEl = document.createElement('div');
        nameEl.textContent = user;
        nameEl.style.fontWeight = '600';
        nameEl.style.fontSize = '12px';
        nameEl.style.marginBottom = '4px';
        bubble.appendChild(nameEl);

        const textEl = document.createElement('div');
        textEl.textContent = msg;
        bubble.appendChild(textEl);
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}
