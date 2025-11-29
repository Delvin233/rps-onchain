"use client";

import Image from "next/image";
import { blo } from "blo";

type BlockieAvatarProps = {
  address: string;
  ensImage?: string | null;
  size?: number;
};

/**
 * Custom Avatar component that uses blo to generate blockie avatars
 */
export const BlockieAvatar = ({ address, ensImage, size = 24 }: BlockieAvatarProps) => {
  const imgSrc = ensImage || blo(address as `0x${string}`);

  return <Image className="rounded-full" src={imgSrc} width={size} height={size} alt={`${address} avatar`} />;
};
