# Zono (CSC 4033)

An open-source, cross-platform mobile application designed to bring friends together through real-time location sharing, communication, and interactive activities.

Developed for the **Software Engineering (CSC 4033)** course at Louisiana Tech University during the Spring 2026 quarter.

---

## The Team

* **Ashton Harrell**
* **Iris Nguyen**
* **Tia Ransom**
* **Cameron Storer**

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
    