// src/comp/Login.js
import React, { useState } from "react";
import { ethers } from "ethers";
import * as ReactBootStrap from "react-bootstrap";

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = ethers.utils.getAddress(accounts[0]);
        localStorage.setItem("Connected", account);
        onLogin(account); // pass account to parent App
      } else {
        setError("MetaMask is not installed");
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed");
    }
    setLoading(false);
  };

  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-light">
      <h2 className="mb-3 text-warning">Blockchain Voting System</h2>
      <p>Login using your Ethereum wallet to continue.</p>
      <button onClick={connectWallet} className="btn btn-primary mt-3 px-5">
        {!loading ? (
          "Connect Wallet"
        ) : (
          <ReactBootStrap.Spinner animation="border" size="sm" />
        )}
      </button>
      {error && <p className="text-danger mt-3">{error}</p>}
    </div>
  );
}

export default Login;
