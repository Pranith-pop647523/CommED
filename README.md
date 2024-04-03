
# CommED

**Interactive 3D Commutative Diagram Creator**

CommED is an innovative tool that allows for the creation of interactive 3D commutative diagrams. It simplifies the process with features such as automatic graph layouts, through a Layout API, and convenient LaTeX exports through a LaTeX API.

## Features

- **Interactive 3D Diagram Creation**: Engage with an intuitive interface to design and manipulate commutative diagrams in two or three dimensions.
- **Automatic Graph Layouts**: Use automatic layout algorithms to organize your diagrams efficiently.
- **LaTeX Export Capability**: Easily export your diagrams into LaTeX format for use in academic documentation.

## Prerequisites
Before installing CommED, you need to have Node.js installed, which includes npm.

Node.js and npm
Node.js is a JavaScript runtime includes npm. npm is a package manager for JavaScript, and is used to install packages required for your project.

- **Installation on Windows and macOS**:
Visit the official Node.js website: https://nodejs.org/
Download the installer for your operating system.
Run the installer and follow the prompts to install Node.js and npm.

- **Installation on Ubuntu (Linux)**:
You can use a package manager like apt to install Node.js and npm. Run the following commands in your terminal:

```
sudo apt update
sudo apt install nodejs npm
```

Verify the installation of Node.js and npm by running:

```
node --version
npm --version
```

Once Node.js and npm are installed, you can proceed with the installation of CommED.

## Installation

To get started with CommED on your local machine, cd into the CommED folder,
and then run the following commands:

```
npm install
```

This command will install all the necessary dependencies for CommED.

## Starting the Application

Once the installation is complete, you can start the application using:

```
npm start
```

This will launch CommED on `localhost:8090`, where you can begin creating and interacting with commutative diagrams. The source code for the APIs are present , but they are configured to run on the GCP hosted one.

## Access Online

Alternatively, if you wish to use CommED without installing it locally, it is available online at:

[https://comm-jade.vercel.app/](https://comm-jade.vercel.app/)


