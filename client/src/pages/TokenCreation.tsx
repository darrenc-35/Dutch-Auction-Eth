import React, { useState } from "react";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { Spinner } from "../components/Spinner";
import { useData } from "../context/DataContext";
import { extractRpcError } from "../utils/utils";
import { CreateTokenInputs } from "../types";

const DefaultUrl =
  "https://firebasestorage.googleapis.com/v0/b/dutch-auction-009.appspot.com/o/images%2Fdefault_token_image.svg?alt=media&token=7327aa1a-6a54-4144-9ac5-e9eee9cd0870";

const TokenCreation = () => {
  const storage = getStorage();
  const { tokerApi, account } = useData();
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTokenInputs>();

  const [url, setUrl] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleImageChange = (e: React.FormEvent) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileSize = file.size / 1024 / 1024;
      if (fileSize > 2) {
        toast.error("Please limit image within 2MB");
        return;
      }
      setUploadLoading(true);
      const imageRef = ref(storage, `images/${file.name}`);
      const uploadTask = uploadBytesResumable(imageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // setProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          toast.error("There's an error in uploading your image, please try again.");
          setUploadLoading(false);
        },
        () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setUrl(downloadURL);
          });
          setUploadLoading(false);
        }
      );
    }
  };

  const createToken = async ({ tokenName, tokenSupply, tokenSymbol }: CreateTokenInputs) => {
    try {
      setSubmitLoading(true);
      await tokerApi.createToken(tokenName, tokenSymbol, tokenSupply, url.length > 0 ? url : DefaultUrl);
      reset();
      setUrl("");
      toast.success(`${tokenSymbol.toUpperCase()} has successfully been created!`);
    } catch (err: any) {
      toast.error(extractRpcError(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(createToken)}>
      <div className="justify-center mt-4 max-w-xl mx-auto">
        <div className="px-6 py-4 bg-white border border-gray-200 rounded-lg shadow min-w-lg">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Token Creation</h2>
          <div className="items-center flex justify-center my-4">
            {url ? (
              <img src={url} alt="no" className="h-24 w-24 rounded-full ring-2 p-1 ring-back" />
            ) : (
              <img src="/default_token_image.svg" alt="no" className="h-24 w-24 rounded-full ring-2 p-1 ring-back" />
            )}
          </div>
          <label className="block mb-2 text-sm font-medium text-gray-900 text-center mb-4" htmlFor="multiple_files">
            Token Preview
          </label>
          <input
            className="block w-full text-sm file:text-gray-900 border file:border-gray-300 rounded-lg cursor-pointer file:bg-gray-50 dark:text-gray-400 focus:outline-none file:rounded-md file:border-0 file:py-1 file:cursor-pointer"
            id="fileUploader"
            type="file"
            onChange={handleImageChange}
            accept="image/*"
          />
          <div className="flex items-center gap-2 mt-2">
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300" id="file_input_help">
              SVG, PNG, JPG or GIF (MAX. 1MB).
            </p>
            {uploadLoading && <Spinner />}
          </div>
          <div className="grid md:grid-cols-2 md:gap-6 mt-6">
            <div className="relative z-0 w-full mb-6 group">
              <input
                maxLength={15}
                {...register("tokenName", { required: "Name is required." })}
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              />
              <label
                htmlFor="token_name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Token name
              </label>
              <span className="text-xs text-red-400">{errors.tokenName?.message}</span>
            </div>
            <div className="relative z-0 w-full mb-6 group">
              <input
                maxLength={4}
                {...register("tokenSymbol", { required: "Symbol is required" })}
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              />
              <label
                htmlFor="token_name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Token symbol
              </label>
              <span className="text-xs text-red-400">{errors.tokenSymbol?.message}</span>
            </div>
          </div>
          <div className="relative z-0 w-full mb-6 group">
            <input
              type="number"
              defaultValue={1}
              max={1000000}
              className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              {...register("tokenSupply", { required: "This is required (1 - 1000000)", min: 1, max: 1000000 })}
            />
            <label
              htmlFor="token_supply"
              className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Total supply
            </label>
            <span className="text-xs text-red-400">{errors.tokenSupply?.message}</span>
          </div>

          <button
            type="submit"
            disabled={submitLoading || uploadLoading}
            className="text-white bg-blue-700 hover:bg-blue-800 cursor-pointer flex items-center gap-2 justify-center disabled:cursor-not-allowed w-full py-2.5 px-5 mr-2 mb-2 disabled:text-slate-500 disabled:bg-gray-200 text-sm font-medium focus:outline-none rounded-full border border-gray-200 focus:z-10 focus:ring-4 focus:ring-gray-200"
          >
            Create Token {submitLoading && <Spinner />}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TokenCreation;
