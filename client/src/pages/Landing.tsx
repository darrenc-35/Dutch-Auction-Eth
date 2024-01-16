import detectEthereumProvider from "@metamask/detect-provider";
import { useData } from "../context/DataContext";
import { toast } from "react-toastify";
import artifact from "../contracts/TokerFactory.json";

export const Landing = () => {
  const { initWeb3 } = useData();

  const connectToMetamask = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      toast.error("Please install metamask");
      return;
    }
    initWeb3(artifact, true);
  };

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="absolute inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div className="mx-auto max-w-2xl sm:py-24 lg:py-36">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Toker for your next ICO</h1>
          <p className="mt-6 text-lg text-gray-600">
            Our platform allow you to participate in the next hottest ICOs with ease using Dutch Auction, simply connect
            to your web3 provider to get started.
          </p>
          <div className="w-3/4 mx-auto justify-center mt-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow ">
              <button
                type="button"
                onClick={async () => await connectToMetamask()}
                className="cursor-pointer py-2.5 w-full px-2 mr-2 mb-2 mt-4 flex items-center font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-grey-900 focus:z-10 focus:ring-4 focus:ring-gray-200"
              >
                <img alt="meta mask icon" src="/meta_mask.png" className="w-10 h-10 float-left" />
                <p className="text-md font-semibold w-full">Connect via MetaMask</p>
              </button>

              <a
                href="https://metamask.io/"
                className="text-blue-500 text-sm font-semibold flex items-center justify-end mt-4"
              >
                Don't have metamask
                <svg
                  className="w-3.5 h-3.5 ml-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 5h12m0 0L9 1m4 4L9 9"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
