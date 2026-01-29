# Realtime Chat App (Threadly)

### Description  
This project is a web application for real-time text communication in an IRC-like style (a simplified Slack). Communication happens through channels and a fixed command-line input that is always part of the UI.

### Diagrams
#### Application architecture diagram
<img width="2442" height="1371" alt="architect" src="https://github.com/user-attachments/assets/eb24bfdd-86fe-44e0-a5da-a90a8ee1c487" />

#### Database (ERD / physical model) diagram
<img width="2790" height="3027" alt="data_model" src="https://github.com/user-attachments/assets/3fa0b884-12dc-4653-a8d5-68e7af309fe0" />

### Features  

#### **Authentication & User Profile**
- User registration, login, and logout  
- User profile includes first name, last name, unique `nickName`, and email  
- User status: `online`, `DND`, `offline` (visible to other users)

#### **Channels & Membership**
- Users see a list of channels they are members of (removed when leaving/kicked, highlighted when invited)  
- Public and private channels; the channel admin is always the creator  
- Channels inactive for more than 30 days are automatically removed  
- Channel creation and management is handled via commands

#### **Commands**
- Create/join channel: `/join channelName [private]`  
- Leave channel: `/cancel`  
- Delete channel (admin): `/quit`  
- List members: `/list`  
- Member management (admin): `/invite`, `/revoke`, `/kick`  
- Public channel: anyone can join; private channel: join only by admin invitation  
- Public channels may permanently ban users after repeated kicks or by admin decision

#### **Messaging**
- Users can send messages only in channels where they are members  
- Mentioning a user via `@nickName` highlights the message for that user  
- Full message history with infinite scroll  
- Real-time typing indicator: shows who is typing, including a live preview of drafted text before sending

#### **Notifications**
- New-message notifications are shown only when the app is not in `visible` state  
- Notifications include sender and a snippet of the message  
- Optional setting: notify only for `@nickName` mentions  
- No notifications in `DND` or `offline` status  
- Switching from `offline` to `online` automatically refreshes channels

### Setup  
To run this project locally, follow these steps.

> Assumption: the repository is split into **backend (AdonisJS + PostgreSQL + Socket.IO)** and **frontend (Quasar)** folders.

#### Backend (AdonisJS)
1. Install dependencies:

        cd adonis-project
        npm install

2. Create `.env` file

3. Configure database connection in `.env` (example):

        DB_CONNECTION=pg
        DB_HOST=127.0.0.1
        DB_PORT=5432
        DB_DATABASE=your_db_name
        DB_USER=your_username
        DB_PASSWORD=your_password

4. Run migrations and seeders:

        node ace migration:run
        node ace db:seed

6. Start the backend dev server:

        node ace serve --watch

#### Frontend (Quasar)
1. Install dependencies:

        cd quasar-project
        npm install

2. Create `.env` file

3. Configure REST API + WebSocket URLs
   
4. Start the frontend dev server:

        quasar dev

### Screenshots
> Login
<img width="2732" height="1536" alt="login" src="https://github.com/user-attachments/assets/66a49edc-68ff-4936-a70d-a906cb8be42f" />

---

> Invitation highlight
<img width="2732" height="1536" alt="invite" src="https://github.com/user-attachments/assets/79b224d5-b56d-40ff-8dc1-945b224ddb52" />

---

> Channel creation
<img width="2732" height="1536" alt="create" src="https://github.com/user-attachments/assets/802c9f15-c511-45e9-bdb6-b92847413cd9" />

---

> Conversation view
<img width="2732" height="1536" alt="chat" src="https://github.com/user-attachments/assets/8ecf65c4-0c82-4dda-bd3b-8961937c147f" />

---

> Members list
<img width="2732" height="1536" alt="list" src="https://github.com/user-attachments/assets/9d30f512-4abc-43fd-b99f-b7bee108a334" />

### Technologies
![https://skillicons.dev/icons?i=python,go,java,ts,react,postgres,redis,docker](https://skillicons.dev/icons?i=vue,ts,adonis,postgres)

> [!NOTE]
> This project was developed as a team collaboration between two students.
