import React, { useState, useEffect } from 'react';
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import readTree from "../../component/constant/readTree.json";
import { useIsMounted } from '../../component/useIsMounted';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { BASEG_CLAIM_ADDR, claimABI } from '../../component/constant/rebaseABI';

import { ConnectButton } from "@rainbow-me/rainbowkit";

//Animations
import burnAnimation from "../burnAnimation.json";
import dynamic from "next/dynamic";
import Image from "next/image";
import logo from '../logo.png'
import Navbar2 from '../../component/navbar/Navbar2';


const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

function div(a: number, b: number) {
  return a / b;
}

const Claim = () => {
  const [getAddress, setGetAddress] = useState<string>('');
  const [getProof, setGetProof] = useState<string[]>([]);
  const [getIndex, setGetIndex] = useState<string>('');
  const [getAmount, setGetAmount] = useState<number>(0);
  const { address } = useAccount();
  const mounted = useIsMounted();
  const { data: hash, isPending, writeContract } = useWriteContract();
  const amountToClaim = getAddress ? div.apply(undefined, [getAmount, 1000000000]) : '0';

  const jsonString = JSON.stringify(readTree);

  useEffect(() => {
    try {

      const tree = StandardMerkleTree.load(JSON.parse(jsonString));

      for (const [i, v] of tree.entries()) {
        if (v[0] === address) {
          const proof = tree.getProof(i);
          setGetProof(proof);
          setGetAddress(v[0]);
          setGetIndex(v[1]);
          setGetAmount(v[2]);
          break; // Once a match is found, exit the loop
        }
      }
    } catch (error) {
      console.log('Error loading Merkle tree:', error);
    }
  }, [address, jsonString]);

  const { data: verifyClaimed } = useReadContract({
    abi: claimABI,
    address: BASEG_CLAIM_ADDR,
    functionName: "airdropped",
    args: [address],
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  async function submit() {
    if (mounted && getAddress && verifyClaimed == true && address) {
      return <div>
        Already Claimed
      </div>
    }
    else {
      writeContract({
        address: BASEG_CLAIM_ADDR,
        abi: claimABI,
        functionName: 'claim',
        args: [getIndex, getAmount, getProof],
      });
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen relative w-full flex  text-center px-4 py-10 sm:px-32 grainy">

        <Lottie className="absolute top-[100px] right-0 w-[300px] opacity-50" animationData={burnAnimation} />
        <Lottie className="absolute bottom-0 left-0 w-[300px] opacity-50" animationData={burnAnimation} />
        <Lottie className="absolute inset-0 w-full h-full opacity-30" animationData={burnAnimation} />

        <div className="pb-12 z-[4]">
          <a href="https://basegains.com/">
            <Image src={logo} width={50} height={50} className="w-24 rounded-full border-4 border-black" alt="" />
          </a>
        </div>

        <div className="flex flex-col justify-center items-center gap-10 z-[4]">
          <h1 className="sm:text-8xl text-4xl font-bold">
            Welcome to <a className="text-blue-600" href="https://basegains.com/">Base Gains <span className="text-orange-600">$BASEG</span> DApp</a>
          </h1>
          <ConnectButton />
          <h1 className="font-bold text-4xl sm:text-2xl">to View The Dashboard</h1>
        </div>
      </div>
    );
  } else {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Navbar2 />
        <div className='p-8 border-orange-500 border-[2px]'>
          <h1 className='text-lg mb-4'>
            {mounted && getAddress && address ? <p>
              Verify Eligibility:
              {getAddress ? 'Congratulation, You are Eligible to Claim Airdrop' : 'Ops, You are not Eligible to Claim Airdrop'}
            </p> : 'Ops, You are not Eligible to Claim Airdrop'}
          </h1>
          <h2 className='mb-4'>
            {mounted && getAmount ? <p>
              Claim Amount:
              {amountToClaim}
            </p> : <p>
              Claim Amount:
              0
            </p>}
          </h2>
          <button
            className=' w-16 rounded-full border-4 border-black'
            disabled={isPending}
            onClick={submit}
          >
            {mounted && getAddress && address ? <p>
              {getAddress ? isPending ? 'Confirming...' : isConfirming ? 'Waiting for confirmation...' : isConfirmed ? 'Claimed' : verifyClaimed === true ? 'Already Claimed' : 'Claim' : 'Not Eligible'}
            </p> : 'Not Eligible'}
          </button>
          <div>
            {hash && <div>
              <a href={`https://testnet.bscscan.com/tx/${hash}`}>Claimed Successfully: view  Txn at {hash}</a>
            </div>}
          </div>
        </div>
      </div>
    )
  }
}

export default Claim;
