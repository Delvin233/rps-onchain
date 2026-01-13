"use client";

import { useState } from "react";
import { Share2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { generateInviteLink, getSocialShareUrls } from "~~/utils/referralUtils";

interface ViralGrowthProps {
  onClaimEngagement?: () => Promise<any>;
  isLoading?: boolean;
}

export const ViralGrowth = ({ onClaimEngagement, isLoading }: ViralGrowthProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { address } = useAccount();

  const handleInviteShare = (platform: string) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const inviteLink = generateInviteLink(address);
    const shareUrls = getSocialShareUrls(inviteLink);

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = shareUrls.twitter;
        break;
      case "telegram":
        shareUrl = shareUrls.telegram;
        break;
      case "whatsapp":
        shareUrl = shareUrls.whatsapp;
        break;
      case "facebook":
        shareUrl = shareUrls.facebook;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      toast.success("Invite link shared! You'll earn rewards when friends join.");
    }
  };

  const copyInviteLink = () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const inviteLink = generateInviteLink(address);
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        toast.success("Invite link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  return (
    <div className="bg-card/50 rounded-xl p-6 mb-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Users className="text-primary" size={24} />
          <div>
            <p className="font-semibold">Invite Friends & Earn</p>
            <p className="text-xs text-base-content/60">Share your invite link and earn GoodDollar rewards!</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn btn-sm btn-outline btn-primary hover:btn-primary transition-all duration-200 min-w-[70px]"
          title={showDetails ? "Hide details" : "Show details"}
        >
          <span className="text-xl font-medium mr-1">{showDetails ? "−" : "+"}</span>
          <span className="text-xs">{showDetails ? "Less" : "More"}</span>
        </button>
      </div>

      {/* Copy Invite Link - Always visible */}
      <div className="bg-base-200 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span className="text-sm font-medium">Your Invite Link</span>
          </div>
          <button onClick={copyInviteLink} className="btn btn-xs btn-primary">
            Copy Link
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4">
          {/* How It Works */}
          <div>
            <h4 className="font-semibold mb-2">💡 How It Works</h4>
            <div className="bg-base-200 rounded-lg p-3 text-sm text-base-content/80">
              <p className="mb-2">
                <strong>GoodDollar handles everything automatically:</strong>
              </p>
              <ul className="space-y-1 text-xs">
                <li>• When friends join through your link, you both earn rewards</li>
                <li>• 60% goes to your friend, 20% to you, 20% to the app</li>
                <li>• No manual tracking needed - it&apos;s all automated!</li>
                <li>• Up to $5,000 G$ in rewards as the app grows</li>
              </ul>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <h4 className="font-semibold mb-2">📱 Share Your Link</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInviteShare("twitter")}
                className="btn btn-sm"
                style={{ backgroundColor: "#1DA1F2", color: "white" }}
              >
                <Share2 size={14} />
                Twitter
              </button>
              <button
                onClick={() => handleInviteShare("telegram")}
                className="btn btn-sm"
                style={{ backgroundColor: "#0088CC", color: "white" }}
              >
                <Share2 size={14} />
                Telegram
              </button>
              <button
                onClick={() => handleInviteShare("whatsapp")}
                className="btn btn-sm"
                style={{ backgroundColor: "#25D366", color: "white" }}
              >
                <Share2 size={14} />
                WhatsApp
              </button>
              <button
                onClick={() => handleInviteShare("facebook")}
                className="btn btn-sm"
                style={{ backgroundColor: "#1877F2", color: "white" }}
              >
                <Share2 size={14} />
                Facebook
              </button>
            </div>
          </div>

          {/* Engagement Rewards Claim Button - if available */}
          {onClaimEngagement && (
            <div>
              <h4 className="font-semibold mb-2">🎁 Claim Engagement Rewards</h4>
              <button
                onClick={async () => {
                  try {
                    await onClaimEngagement();
                    toast.success("Engagement rewards claimed successfully!");
                  } catch {
                    toast.error("Failed to claim engagement rewards");
                  }
                }}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Claiming..." : "Claim Engagement Rewards"}
              </button>
              <p className="text-xs text-base-content/60 mt-2">
                Additional rewards for your engagement with the GoodDollar ecosystem
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
