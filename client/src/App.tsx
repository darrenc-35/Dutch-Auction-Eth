import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import { DataProvider } from "./context/DataContext";
import Wallet from "./pages/Wallet";
import TokenCreation from "./pages/TokenCreation";
import { PrivateRoute } from "./components/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TokenPage from "./pages/TokenDetail";
import { Container } from "./components/Container";
import { PageNotFound } from "./pages/PageNotFound";
import { initializeApp } from "firebase/app";
import AuctionCreation from "./pages/AuctionCreation";
import AuctionPage from "./pages/AuctionDetail";

declare global {
  interface Window {
    web3: any;
    ethereum?: any;
  }
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

export function App() {
  initializeApp(firebaseConfig);
  return (
    <div className="h-full bg-white">
      <DataProvider>
        <ToastContainer />
        <PrivateRoute>
          <Navbar />
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/create/token" element={<TokenCreation />} />
              <Route path="/create/auction" element={<AuctionCreation />} />
              <Route path="/token/:tokenSymbol" element={<TokenPage />} />
              <Route path="/auction/:auctionId" element={<AuctionPage />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Container>
        </PrivateRoute>
      </DataProvider>
    </div>
  );
}

export default App;
