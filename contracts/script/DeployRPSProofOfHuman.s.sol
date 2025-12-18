// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { Script, console } from "forge-std/Script.sol";
import { RPSProofOfHuman } from "../src/RPSProofOfHuman.sol";
import { SelfUtils } from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";

/**
 * @title DeployRPSProofOfHuman
 * @notice Deployment script for RPSProofOfHuman contract
 */
contract DeployRPSProofOfHuman is Script {
    // Custom errors for deployment verification
    error DeploymentFailed();

    /**
     * @notice Main deployment function
     * @return rpsProofOfHuman The deployed RPSProofOfHuman contract instance
     * @dev Requires the following environment variables:
     *      - IDENTITY_VERIFICATION_HUB_ADDRESS: Address of the Self Protocol verification hub
     *      - SCOPE_SEED: Scope seed value (defaults to "self-workshop")
     *      - PRIVATE_KEY: Private key for deployment
     */
    function run() public returns (RPSProofOfHuman rpsProofOfHuman) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hubAddress = vm.envAddress("IDENTITY_VERIFICATION_HUB_ADDRESS");
        string memory scopeSeed = vm.envOr("SCOPE_SEED", string("self-workshop"));

        // Set up verification configuration
        string[] memory forbiddenCountries = new string[](0); // No forbidden countries for now
        
        SelfUtils.UnformattedVerificationConfigV2 memory verificationConfig = SelfUtils.UnformattedVerificationConfigV2({
            olderThan: 18,
            forbiddenCountries: forbiddenCountries,
            ofacEnabled: false
        });

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        rpsProofOfHuman = new RPSProofOfHuman(hubAddress, scopeSeed, verificationConfig);

        vm.stopBroadcast();

        // Log deployment information
        console.log("RPSProofOfHuman deployed to:", address(rpsProofOfHuman));
        console.log("Identity Verification Hub:", hubAddress);
        console.log("Scope Seed:", scopeSeed);
        console.log("Scope Value:", rpsProofOfHuman.scope());

        // Verify deployment was successful
        if (address(rpsProofOfHuman) == address(0)) revert DeploymentFailed();

        console.log("Deployment verification completed successfully!");
        console.log("Contract address (lowercase):", _toLowercase(address(rpsProofOfHuman)));
    }

    /**
     * @notice Convert address to lowercase string
     * @param addr The address to convert
     * @return The lowercase string representation
     */
    function _toLowercase(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory result = new bytes(42);
        result[0] = '0';
        result[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            uint8 b = uint8(data[i]);
            uint8 hi = b >> 4;
            uint8 lo = b & 0x0f;
            
            result[2 + i * 2] = _toHexChar(hi);
            result[3 + i * 2] = _toHexChar(lo);
        }
        
        return string(result);
    }

    /**
     * @notice Convert uint8 to hex character
     * @param value The value to convert (0-15)
     * @return The hex character
     */
    function _toHexChar(uint8 value) internal pure returns (bytes1) {
        if (value < 10) {
            return bytes1(uint8(bytes1('0')) + value);
        } else {
            return bytes1(uint8(bytes1('a')) + value - 10);
        }
    }
}