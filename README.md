
![# Zono (CSC 4033)](https://raw.githubusercontent.com/CameronStorer/CSC4033/d13635e5a1d4984df3f7a67fd8e30be4adb08fe5/assets/images/Zono%20Logo.svg)

An open-source, cross-platform mobile application designed to bring friends together through real-time location sharing, communication, and interactive activities.

Developed for the **Software Engineering (CSC 4033)** course at Louisiana Tech University during the Spring 2026 quarter.

---

## The Team

* **Ashton Harrell**
* **Khai Tran Nguyen (Iris)**
* **Tia Ransom**
* **Cameron Storer**

---
## Pictures
<img width="354" height="768" alt="image0 jpg-3" src="https://github.com/user-attachments/assets/9da4e318-7ace-4fdc-8ebd-ed18c0777077" />
<img width="354" height="768" alt="image0 jpg-2" src="https://github.com/user-attachments/assets/62f1479f-55ec-420d-97b6-b7a12d27519b" />
<img width="354" height="768" alt="Screenshot_20260508_203309_Expo_Go jpg" src="https://github.com/user-attachments/assets/15d34249-2ebc-44e2-8416-94ca0543d9d2" />
<img width="354" height="768" alt="IMG_1829 png" src="https://github.com/user-attachments/assets/4379d00c-0b91-4415-839e-52db463a31e8" />
<img width="354" height="768" alt="IMG_1827 png" src="https://github.com/user-attachments/assets/ceb8e535-8f2d-4bdc-bd7e-9538a8c5420c" />
<img width="354" height="768" alt="IMG_1632 png" src="https://github.com/user-attachments/assets/9ca8e62d-be7a-44db-942c-4a787815a6bb" />
<img width="354" height="768" alt="image0 jpg" src="https://github.com/user-attachments/assets/fb61e529-b942-42d5-8169-17d018cb28af" />
<img width="354" height="768" alt="Screenshot 2026-09-03 at 6 43 06 PM" src="https://github.com/user-attachments/assets/354f6d21-7c1b-4edd-b585-f13830b722c4" />
<img width="354" height="768" alt="Screenshot_20260516_145531_Expo_Go jpg" src="https://github.com/user-attachments/assets/75fe0771-2984-4907-8d7b-aaa964db0ee1" />

---

## Features

* **Live GPS Map:** View your own location and track friends in real time.
* **Communication:** Stay connected with seamless in-app messaging.
* **Activities & Competitions:** Engage and compete with friends in fun-filled challenges.

---

## Tech Stack

* **Frontend:** React Native / Expo (Android & iOS)
* **Backend & Database:** Supabase, Ollama, Typescript
* **Runtime Environment:** Node.js

---

## Instructions

Follow these steps to set up the project locally on your machine.

### Prerequisites

Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (LTS version recommended)
* [Expo Go](https://expo.dev/client) app installed on your Android or iOS mobile device

### Installation & Setup

1. **Clone the Repository**
   Clone the project to your local machine and navigate into the project root:
   ```bash
   git clone https://github.com/CameronStorer/CSC4033.git
   cd CSC4033
   ```

2. **Run `npm install` at the root directory (`CSC4033/`)**
    Necessary to install the required node modules.

3. **Spin up a **Supabase** server instance and generate an API key**
    This is required for full app functionality.

4. [Optional] **Spin up an **Ollama** server instance and generate an API key**
    Connecting the app to an ollama service allows app users to utilize AI chatbots in-app.

5. **Run `npx expo start` to start the project**
    Chosen method to debug and visualize Zono on a smart phone.

6. **Scan the generated QR code on a compatible device while connected to the same local network**
    Important step to ge the app running on your mobile device.

\* Place all API keys into a local .env file following the format of the already present .env.example file.
    
