// import { ethers } from "ethers";
// import * as ReactBootStrap from "react-bootstrap";
// import { useState, useEffect } from "react";
// import ABIFILE from "./artifacts/contracts/BlockchainVoting.sol/BlockchainVoting.json";
// import FatcVoter from "./comp/FatcVoter";
// import Propsal from "./comp/Propsal";
// import Set from "./comp/FatchCandi";
// import Vote from "./comp/Vote";
// const ABI = ABIFILE.abi;
// const ContractAddress = "0xE984f31e44273844F9B313d66eBED6Eb8e73376D";

// function App() {
//   const [account, setAccount] = useState("");
//   const [contract, setContract] = useState(null);
//   const [provider, setProvider] = useState(null);
//   const [isoff, setOff] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const Dicconnect = async () => {
//     if (typeof window !== "undefined") {
//       if (window.localStorage.getItem("Connected")) {
//         window.localStorage.removeItem("Connected");
//         setOff(false);
//         window.location.reload();
//       } else {
//       }
//     }
//   };
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       if (window.localStorage.getItem("Connected")) {
//         Connect();
//       }
//     }
//   }, []);

//   const Connect = async (e) => {
//     // e.preventDefault();
//     setLoading(true);
//     if (typeof window.ethereum !== "undefined") {
//       const account = await window.ethereum.request({
//         method: "eth_requestAccounts",
//       });

//       setOff(true);
//       window.localStorage.setItem("Connected", "injected");
//       console.log(account);
//       setAccount(account);
//       document.getElementById("connectbtn").innerHTML = account;

//       const provider = new ethers.providers.Web3Provider(window.ethereum);
//       setProvider(provider);

//       const signer = provider.getSigner();
//       console.log(signer);
//       const contract = new ethers.Contract(ContractAddress, ABI, signer);
//       setContract(contract);
//       console.log(contract);
//     }
//   };
//   return (
//     <div
//       className="mx-auto p-4 text-light  "
//       style={{
//         width: 1000,
//         marginTop: 25,
//         backgroundColor: "rgb(135,62,35)",
//       }}
//     >
//       <p className="text-center h5 text-warning p-2">
//         Blockchain for Electronic Voting System
//       </p>
//       <p>Please Connect sepolia</p>
//       <div className="d-flex justify-content-between">
//         <button
//           onClick={Connect}
//           id="connectbtn"
//           className="btn btn-success mx-2"
//         >
//           {!loading ? (
//             "Connect"
//           ) : (
//             <ReactBootStrap.Spinner
//               as="span"
//               animation="grow"
//               size="sm"
//               role="status"
//               aria-hidden="true"
//             />
//           )}
//         </button>

//         <button
//           onClick={Dicconnect}
//           id="Dissconnectbtn"
//           className="btn btn-success mx-2"
//           disabled={!isoff}
//         >
//           Disconnect
//         </button>
//       </div>

//       <br></br>
       
//       <Set contract={contract} account={account} provider={provider} />

//       <Vote contract={contract} account={account} provider={provider} />

//       <FatcVoter contract={contract} account={account} provider={provider} />

//       <Propsal contract={contract} account={account} provider={provider} />
//     </div>
//   );
// }

// export default App;



/**
 * App.js — ChainVote (Enterprise Edition)
 * Login gate → JWT backend → MetaMask wallet → Voting dashboard
 */


import { ethers } from "ethers";
import { useState, useEffect } from "react";
import ABIFILE from "./artifacts/contracts/BlockchainVoting.sol/BlockchainVoting.json";
import FatcVoter from "./comp/FatcVoter";
import Propsal   from "./comp/Propsal";
import Set       from "./comp/FatchCandi";
import Vote      from "./comp/Vote";
import * as Auth from "./services/authService";
import "./App.css";

const ABI             = ABIFILE.abi;
const ContractAddress = "0xE984f31e44273844F9B313d66eBED6Eb8e73376D";

// ══════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ══════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await Auth.login(username, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grid"    aria-hidden="true" />
      <div className="login-glow top-left"     aria-hidden="true" />
      <div className="login-glow bottom-right" aria-hidden="true" />

      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <polygon points="24,4 44,14 44,34 24,44 4,34 4,14"
              fill="none" stroke="#00e5ff" strokeWidth="2" />
            <polygon points="24,12 36,18 36,30 24,36 12,30 12,18"
              fill="none" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="24" cy="24" r="5" fill="#00e5ff" />
          </svg>
        </div>

        <h1 className="login-title">ChainVote</h1>
        <p className="login-subtitle">Enterprise Blockchain Voting Platform</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="field-group">
            <label className="field-label" htmlFor="username">Username or Email</label>
            <input
              id="username"
              className="field-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="field-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Sign In"}
          </button>
        </form>

        <p className="login-hint">Contact your administrator for credentials.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function Dashboard({ user, onLogout }) {
  const [account,     setAccount]     = useState("");
  const [contract,    setContract]    = useState(null);
  const [provider,    setProvider]    = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [userRecord,  setUserRecord]  = useState(user);

  // ── Reconnect wallet on reload ─────────────────────────
  useEffect(() => {
    if (window.localStorage.getItem("Connected")) connectWallet();
  }, []);

  const connectWallet = async () => {
    setWalletLoading(true);
    try {
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask not detected. Please install MetaMask.");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      window.localStorage.setItem("Connected", "injected");
      setAccount(accounts[0]);
      setIsConnected(true);

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);
      const signer   = web3Provider.getSigner();
      const deployed = new ethers.Contract(ContractAddress, ABI, signer);
      setContract(deployed);

      // Persist wallet address to backend
      try {
        const updated = await Auth.updateWallet(accounts[0]);
        setUserRecord(updated.user);
      } catch (_) { /* non-fatal */ }
    } catch (err) {
      console.error("Wallet connection error:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const disconnectWallet = () => {
    window.localStorage.removeItem("Connected");
    setIsConnected(false);
    setAccount("");
    setContract(null);
    setProvider(null);
  };

  const handleLogout = async () => {
    await Auth.logout();
    onLogout();
  };

  const shortAddress = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "";

  const tabs = [
    { id: "overview",   label: "Overview",   icon: "⬡" },
    { id: "candidates", label: "Candidates", icon: "◈" },
    { id: "vote",       label: "Cast Vote",  icon: "◉" },
    { id: "voters",     label: "Voters",     icon: "◎" },
    { id: "proposals",  label: "Proposals",  icon: "◇" },
    ...(userRecord?.role === "admin" ? [{ id: "admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <div className="app-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <polygon points="24,4 44,14 44,34 24,44 4,34 4,14"
              fill="none" stroke="#00e5ff" strokeWidth="2" />
            <circle cx="24" cy="24" r="5" fill="#00e5ff" />
          </svg>
          <span className="sidebar-brand">ChainVote</span>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`nav-item ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {activeTab === t.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="sidebar-user">
          <div className="user-avatar">{userRecord?.username?.[0]?.toUpperCase()}</div>
          <div className="user-meta">
            <span className="user-name">{userRecord?.username}</span>
            <span className={`user-role role-${userRecord?.role}`}>{userRecord?.role}</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="network-badge">
            <span className="network-dot" />
            Sepolia Testnet
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="main-panel">
        {/* Topbar */}
        <header className="topbar">
          <h2 className="page-title">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>

          <div className="topbar-right">
            {!isConnected ? (
              <button className="wallet-btn connect" onClick={connectWallet} disabled={walletLoading}>
                {walletLoading
                  ? <span className="btn-spinner dark" />
                  : <><span className="wallet-icon">⬡</span> Connect Wallet</>
                }
              </button>
            ) : (
              <div className="wallet-info">
                <div className="wallet-address">
                  <span className="wallet-dot" />
                  {shortAddress}
                </div>
                <button className="wallet-btn disconnect" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          {!isConnected && (
            <div className="wallet-warning">
              <span className="warning-icon">⚠</span>
              Connect your MetaMask wallet on the Sepolia network to interact with the contract.
            </div>
          )}

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="overview-grid">
              <div className="stat-card">
                <div className="stat-icon blue">⬡</div>
                <div className="stat-info">
                  <span className="stat-label">Network</span>
                  <span className="stat-value">Sepolia</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon cyan">◉</div>
                <div className="stat-info">
                  <span className="stat-label">Contract</span>
                  <span className="stat-value mono">{ContractAddress.slice(0, 10)}…</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">◎</div>
                <div className="stat-info">
                  <span className="stat-label">Wallet</span>
                  <span className="stat-value">{isConnected ? shortAddress : "Not Connected"}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon amber">◇</div>
                <div className="stat-info">
                  <span className="stat-label">Role</span>
                  <span className={`stat-value role-${userRecord?.role}`}>
                    {userRecord?.role}
                  </span>
                </div>
              </div>

              <div className="info-card full-width">
                <h3 className="card-heading">Welcome back, {userRecord?.username}</h3>
                <p className="card-body">
                  ChainVote is a tamper-proof, decentralised voting system built on Ethereum.
                  All votes are recorded immutably on-chain, ensuring full transparency and auditability.
                  Connect your MetaMask wallet and navigate the tabs to manage candidates,
                  cast your vote, register voters, and browse proposals.
                </p>
                {userRecord?.walletAddress && (
                  <p className="card-body" style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--cyan)" }}>
                    Registered wallet: {userRecord.walletAddress}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="tab-section">
              <Set contract={contract} account={account} provider={provider} />
            </div>
          )}

          {activeTab === "vote" && (
            <div className="tab-section">
              <Vote contract={contract} account={account} provider={provider} />
            </div>
          )}

          {activeTab === "voters" && (
            <div className="tab-section">
              <FatcVoter contract={contract} account={account} provider={provider} />
            </div>
          )}

          {activeTab === "proposals" && (
            <div className="tab-section">
              <Propsal contract={contract} account={account} provider={provider} />
            </div>
          )}

          {activeTab === "admin" && userRecord?.role === "admin" && (
            <AdminPanel />
          )}
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN PANEL — user management
// ══════════════════════════════════════════════════════════
function AdminPanel() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await Auth.getAllUsers({ search, limit: 50 });
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleActive = async (user) => {
    try {
      await Auth.updateUserById(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This is permanent.`)) return;
    try {
      await Auth.deleteUserById(user.id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <h3 className="card-heading" style={{ margin: 0 }}>User Management</h3>
        <input
          className="field-input"
          style={{ width: 240 }}
          placeholder="Search username or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
        />
        <button className="action-btn" onClick={fetchUsers}>Refresh</button>
      </div>

      {error && <p className="login-error">{error}</p>}

      {loading ? (
        <div className="loading-state">
          <span className="btn-spinner dark" style={{ width: 24, height: 24, borderWidth: 3 }} />
        </div>
      ) : (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Wallet</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono">{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {u.walletAddress
                      ? `${u.walletAddress.slice(0, 8)}…${u.walletAddress.slice(-6)}`
                      : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${u.isActive ? "active" : "inactive"}`}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleDateString()
                      : <span style={{ color: "var(--text-muted)" }}>Never</span>}
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className={`action-btn ${u.isActive ? "warn" : "success"}`}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                      <button className="action-btn danger" onClick={() => handleDelete(u)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ROOT — auth gate
// ══════════════════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(() => Auth.getUser());

  // Verify session is still valid on mount
  useEffect(() => {
    if (user) {
      Auth.getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          Auth.clearAccessToken();
          Auth.clearUser();
          setUser(null);
        });
    }
  }, []);

  const handleLogin  = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />;
}

export default App;