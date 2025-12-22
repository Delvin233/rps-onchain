// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SelfVerificationRoot } from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import { ISelfVerificationRoot } from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import { SelfStructs } from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import { SelfUtils } from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import { IIdentityVerificationHubV2 } from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title RPSProofOfHuman
 * @notice RPS OnChain implementation of SelfVerificationRoot for identity verification
 * @dev This contract provides identity verification for RPS OnChain game
 */
contract RPSProofOfHuman is SelfVerificationRoot {
    // Verification result storage
    mapping(address => bool) public verifiedUsers;
    mapping(address => ISelfVerificationRoot.GenericDiscloseOutputV2) public userVerificationData;
    
    // Verification config storage
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;

    // Events
    event UserVerified(address indexed user, ISelfVerificationRoot.GenericDiscloseOutputV2 output);

    /**
     * @notice Constructor for RPS OnChain verification contract
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeSeed The scope seed that is used to create the scope of the contract
     * @param _verificationConfig The verification configuration
     */
    constructor(
        address identityVerificationHubV2Address,
        string memory scopeSeed, 
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    )
        SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed)
    {
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        verificationConfigId =
            IIdentityVerificationHubV2(identityVerificationHubV2Address).setVerificationConfigV2(verificationConfig);
    }

    /**
     * @notice Implementation of customVerificationHook from SelfVerificationRoot
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param output The verification output from the hub
     * @param userData The user data passed through verification
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    )
        internal
        override
    {
        address userAddress = address(uint160(output.userIdentifier));
        
        // Mark user as verified
        verifiedUsers[userAddress] = true;
        userVerificationData[userAddress] = output;

        emit UserVerified(userAddress, output);
    }

    /**
     * @notice Implementation of getConfigId from SelfVerificationRoot
     * @dev Returns the verification config ID for this contract
     * @return The verification configuration ID
     */
    function getConfigId(
        bytes32, /* destinationChainId */
        bytes32, /* userIdentifier */
        bytes memory /* userDefinedData */
    )
        public
        view
        override
        returns (bytes32)
    {
        return verificationConfigId;
    }

    /**
     * @notice Check if a user is verified
     * @param user The user address to check
     * @return True if user is verified
     */
    function isUserVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    /**
     * @notice Get user verification data
     * @param user The user address
     * @return The verification output data
     */
    function getUserVerificationData(address user) external view returns (ISelfVerificationRoot.GenericDiscloseOutputV2 memory) {
        return userVerificationData[user];
    }
}