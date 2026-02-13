from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, leave_room, emit
import random, string

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

rooms = {}

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('create_room')
def handle_create_room(data):
    username = data.get('username')
    if not username:
        emit("error", "Username required")
        return

    code = generate_room_code()
    rooms[code] = {"users": set(), "admin": username}
    emit("room_created", {"code": code, "admin": username})

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    username = data.get('username')

    if not room or not username:
        emit("error", "Room and username required")
        return

    if room not in rooms:
        emit("error", "Room does not exist")
        return

    join_room(room)
    rooms[room]["users"].add(username)

    emit("update_users", len(rooms[room]["users"]), to=room)
    emit("message", {"user": "System", "msg": f"{username} joined 🚀"}, to=room)

@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room')
    username = data.get('username')

    if room in rooms:
        leave_room(room)
        rooms[room]["users"].discard(username)
        emit("update_users", len(rooms[room]["users"]), to=room)
        emit("message", {"user": "System", "msg": f"{username} left ⚡"}, to=room)

@socketio.on('destroy_room')
def handle_destroy_room(data):
    room = data.get('room')
    username = data.get('username')

    if room in rooms and rooms[room]["admin"] == username:
        emit("room_destroyed", {"room": room}, to=room)
        del rooms[room]

@socketio.on('send_message')
def handle_message(data):
    room = data.get('room')
    emit("message", data, to=room)

@socketio.on('typing')
def handle_typing(data):
    emit("typing", data['username'], to=data['room'], include_self=False)

@socketio.on('send_image')
def handle_image(data):
    emit("image", data, to=data['room'])

if __name__ == '__main__':
    socketio.run(app, debug=True)
