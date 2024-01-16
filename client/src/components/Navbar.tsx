import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { classNames } from "../utils/utils";
import { Paths } from "../constants/paths";

const navigation = [
  { name: "Home", path: Paths.HOME },
  { name: "Wallet", path: Paths.WALLET },
];

const createNavigation = [
  { name: "Token", path: Paths.CREATE_TOKEN },
  { name: "Auction", path: Paths.CREATE_AUCTION },
];

function truncateAddress(address: string) {
  return address.slice(0, 4) + "..." + address.slice(address.length - 4);
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="bg-white w-full border-b border-gray-200 ">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img src="https://flowbite.com/docs/images/logo.svg" className="h-8 mr-3" alt="Flowbite Logo" />
          <span className="self-center text-xl font-semibold whitespace-nowrap">Toker</span>
        </div>
        <div className="flex md:order-2">
          <AccountMenu />
        </div>
        <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
          <div className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white">
            {navigation.map((item) => (
              <div
                key={item.name}
                onClick={() => navigate(item.path)}
                className={classNames(
                  item.path === location.pathname ? "text-blue-700" : "text-gray-900 hover:text-blue-700",
                  "block py-2 pl-3 pr-4 rounded font-semibold cursor-pointer"
                )}
              >
                {item.name}
              </div>
            ))}
            <CreateDropdown />
          </div>
        </div>
      </div>
    </div>
  );
}

const CreateDropdown = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Menu as="div" className="relative inline-block text-gray-900 hover:text-blue-700">
      <div>
        <Menu.Button className="flex items-center py-2 pl-3 pr-4 rounded cursor-pointer font-semibold cursor-pointer">
          <p className={createNavigation.filter((i) => i.path === location.pathname).length > 0 ? "text-blue-700" : ""}>
            Create
          </p>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {createNavigation.map((item) => (
              <Menu.Item key={item.name}>
                <p
                  onClick={() => navigate(item.path)}
                  className={classNames("text-gray-700 cursor-pointer hover:bg-gray-50", "block px-4 py-2 text-sm")}
                >
                  {item.name}
                </p>
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
const AccountMenu = () => {
  const { account, tokerApi, web3 } = useData();
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const getBalance = async () => {
      try {
        const eth = await tokerApi.getEthBalance();
        setBalance(eth.slice(0, 10));
      } catch (err) {
        toast.error("unable to get account details");
      }
    };
    getBalance();
  }, [web3, tokerApi]);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          Account: {truncateAddress(account)}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <div
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                >
                  <p className="font-semibold">{account}</p>
                  <hr className="my-1 h-0.5 border-t-1 bg-gray-700 opacity-20" />
                  <div className="flex justify-between font-semibold mt-2">
                    <p>Balance:</p>
                    <p>{balance} Eth</p>
                  </div>
                </div>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
