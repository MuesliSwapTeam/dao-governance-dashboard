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


### ✅ **Milestone 3: Transaction Builder Implementation**  
This milestone focuses on implementing the constructions of the transaction necessary to interact with the DAO Smart Contracts:

- **👀 Staking** – Stake(Lock) und Unstake (Unlock) Governance Tokens and view current staking positions
- **📜 Proposal Voting** – Users can create on-chain proposals and vote for community proposals through on-chain voting
- **👀 Proposal Viewing** – View detailed information on proposals including voting results
- **🏦 Treasury Overview** – View DAO treasury history and value development


### ✅ **Milestone 4: Feature Expansion & Beta Mainnet Release**

This milestone focuses on expanding the governance dashboard with advanced features and deploying the first **beta version** on the **Cardano Mainnet**. The goal is to enhance real-world usability, improve the user experience, and ensure secure, stable on-chain governance interactions.

**Key Additions and Improvements:**

* **🚀 Beta Mainnet Deployment** – Launch of the DAO Governance Dashboard on Cardano Mainnet for real DAO testing and adoption.
* **🔐 Governance Token Integration** – Full support for native governance token interactions (e.g., vaults).
* **⚙️ Performance & Security Enhancements** – Optimized on-chain transaction handling and backend data fetching to ensure faster and more secure user experiences.

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
