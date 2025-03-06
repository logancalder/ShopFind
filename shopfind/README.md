# ShopFind - CSEN 163 Project
## Logan Calder, Ashwin Raman, Jake Esperson

<!-- Table of Contents -->
# Table of Contents

- [Table of Contents](#table-of-contents)
  - [About the Project](#about-the-project)
    - [Tech Stack](#tech-stack)
    - [Environment Variables](#environment-variables)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Run Locally](#run-locally)
  

<!-- About the Project -->
## About the Project
ShopFind is a web application that allows users to find products from their local businesses. Simply search for any product you can think of and it will populate with stores in your local area that have it! ShopFind is built using Next.js, which uses React, TailwindCSS, and the Radix UI library.


<!-- TechStack -->
### Tech Stack

- [Next.js](https://nextjs.org/) which uses [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://radix-ui.com/)


<!-- Env Variables -->
### Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` = `pk.eyJ1IjoibG9nYW5jYWxkZXIiLCJhIjoiY203dXVldjBqMDRoODJtcHpydGE2bHY2ciJ9.HnZB7f_n7yf01N36P2w2QQ`<br>
(which is also already included in the project)


<!-- Getting Started -->
## Getting Started

<!-- Prerequisites -->
### Prerequisites

This project uses Node.js as package manager and you need to have it installed on your machine. You can download it [here](https://nodejs.org/).

<!-- Run Locally -->
### Run Locally

Clone the project

```bash
  gh repo clone logancalder/ShopFind
```

Go to the project directory

```bash
  cd ShopFind/shopfind
```

Install dependencies

```bash
  npm i
```

Start the server

```bash
  npm run dev
```