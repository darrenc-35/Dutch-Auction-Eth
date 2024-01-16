import Web3 from "web3";

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const calculateTimeLeft = (targetDate: number) => {
  const now = new Date().getTime();
  const targetTime = new Date(targetDate * 1000).getTime();
  const timeDifference = targetTime - now;

  if (timeDifference <= 0) {
    return { hours: "0", minutes: "0", seconds: "0" };
  }

  const hours = Math.floor(timeDifference / (1000 * 60 * 60)).toString();
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)).toString();
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000).toString();

  return { hours, minutes, seconds };
};

export class NumberFormator {
  static thousand = (amount: number) => {
    const temp = [];
    const amountString = Array.from(amount.toString()).reverse().join("");
    for (let i = 0; i < amountString.length; i++) {
      if (temp.length > 0 && i % 3 === 0) {
        temp.push(",");
      }
      temp.push(amountString[i]);
    }
    return temp.reverse().join("");
  };
}

export const delay = async (timeout: number) => {
  return new Promise((x) => setTimeout(x, timeout));
};

export const EthToWei = (value: number): string => {
  const wei = Web3.utils.toWei(value.toString(), "ether");
  return wei;
};

export const WeiToEth = (value: number): number => {
  const eth = Web3.utils.fromWei(Web3.utils.toWei(value.toString(), "wei"), "ether");
  return parseFloat(eth);
};

export function extractRpcError(error: any) {
  console.log(error);
  if (typeof error === "object") {
    if ("message" in error) {
      if (error.message.includes("VM Exception")) {
        const startPattern = '"reason":';
        const start = error.message.indexOf(startPattern) + startPattern.length;
        const end = error.message.indexOf('"message": "revert"');
        const revertReason = error.message.substring(start, end).trim().replace('",', "").replace('"', "");
        console.log("Reason:", revertReason);
        return revertReason;
      } else {
        return error.message;
      }
    }
  }
}
