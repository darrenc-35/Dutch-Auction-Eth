import { useData } from "../context/DataContext";
import { Landing } from "../pages/Landing";

export const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { web3 } = useData();
  return web3 ? <>{children}</> : <Landing />;
};
