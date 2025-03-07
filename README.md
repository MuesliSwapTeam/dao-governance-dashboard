# **Cardano DAO Governance Dashboard**  

## **Overview**  

The **Cardano DAO Governance Dashboard** provides a seamless and intuitive interface for decentralized autonomous organizations (DAOs) on Cardano to efficiently manage their governance processes. Built as an **open-source** solution, this dashboard integrates with the **MuesliSwap smart contract framework** to enable a fully decentralized and transparent governance experience.  

## **Problem Statement**  

Many DAOs on Cardano currently operate with **fragmented and inefficient governance mechanisms** that hinder participation and transparency. Moreover, many existing systems are **not fully on-chain**, leading to decreased engagement and effectiveness.  

This project solves these challenges by providing a **user-friendly, open-source dashboard** that facilitates **on-chain governance** with key functionalities such as:  
- **Cardano wallet connection**  
- **Proposal creation & viewing**  
- **Voting mechanisms**  
- **Basic treasury management**  

## **Key Features**  

### ✅ **Milestone 2: Core Feature Implementation**  
This milestone focuses on implementing the essential governance functionalities:  

- **🔗 Cardano Wallet Connection** – Connect to a Cardano wallet (e.g., Nami, Eternl) to interact with governance features.  
- **📜 Proposal Creation** – Users can create and submit proposals for community governance.  
- **👀 Proposal Viewing** – See a list of active proposals along with details such as descriptions and statuses.  
- **🏦 Treasury Management (Basic)** – View DAO treasury balance and create treasury transactions

## **Tech Stack**  

The project is built using modern web technologies and Cardano-specific tooling:  

- **Frontend**: React + TypeScript + Vite  
- **Blockchain Integration**: `@emurgo/cardano-serialization-lib`  
- **Backend**: Smart contract-based data retrieval for governance proposals, transaction history, and voting results.  

## **Installation & Setup**  

To run the project locally:  

1. **Clone the repository:**  

2. **Install dependencies:**  
   ```sh
   npm install
   ```

3. **Start the development server:**  
   ```sh
   npm run dev
   ```

4. **Testnet Setup:**  
   - Ensure you have a Cardano-compatible wallet installed (e.g., [Nami](https://namiwallet.io/) or [Eternl](https://eternl.io/)).  
   - Switch your wallet to **Preprod Network** to interact with the testnet version of the DAO governance dashboard.  

## **Demo Website**  

The project is currently deployed on **Cardano Preprod Testnet** and can be accessed at:  

🔗 **[DAO Governance Dashboard (Testnet)](http://preprod.dao.muesliswap.com)**  


## **Contribution & Open Source**  

This project is **open-source**, allowing other DAOs and developers in the **Cardano ecosystem** to adopt and extend the governance dashboard. Contributions are welcome!  

### **How to Contribute**  
- Fork the repository  
- Create a feature branch  
- Submit a pull request  
