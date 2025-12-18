…/packages/nextjs main  ❯ cd "/home/delvo/Documents/Web3/rps-onchain" && mkdir -p contracts

rps-onchain main ❯ cd "/home/delvo/Documents/Web3/rps-onchain/contracts" && forge init --no-git --no-commit .
bash: command not found: forge

rps-onchain/contracts main ✗ cd "/home/delvo/Documents/Web3/rps-onchain" && which forge
which: no forge in (/home/delvo/.local/share/mise/installs/node/25.2.1/bin:/home/delvo/.local/share/mise/installs/python/3.14.2/bin:/home/delvo/.local/share/omarchy/bin:/home/delvo/.local/share/../bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/lib/jvm/default/bin:/usr/bin/site_perl:/usr/bin/vendor_perl:/usr/bin/core_perl)

rps-onchain main ✗ curl -L https://foundry.paradigm.xyz | bash
% Total % Received % Xferd Average Speed Time Time Time Current
Dload Upload Total Spent Left Speed
100 167 100 167 0 0 524 0 --:--:-- --:--:-- --:--:-- 526
100 2198 100 2198 0 0 3260 0 --:--:-- --:--:-- --:--:-- 3260
Installing foundryup...

Detected your preferred shell is bash and added foundryup to PATH.
Run 'source /home/delvo/.bashrc' or start a new terminal session to use foundryup.
Then, simply run 'foundryup' to install Foundry.
…/packages/nextjs main  ❯ cd "/home/delvo/Documents/Web3/rps-onchain" && mkdir -p contracts

rps-onchain main ❯ cd "/home/delvo/Documents/Web3/rps-onchain/contracts" && forge init --no-git --no-commit .
bash: command not found: forge

rps-onchain/contracts main ✗ cd "/home/delvo/Documents/Web3/rps-onchain" && which forge
which: no forge in (/home/delvo/.local/share/mise/installs/node/25.2.1/bin:/home/delvo/.local/share/mise/installs/python/3.14.2/bin:/home/delvo/.local/share/omarchy/bin:/home/delvo/.local/share/../bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/lib/jvm/default/bin:/usr/bin/site_perl:/usr/bin/vendor_perl:/usr/bin/core_perl)

rps-onchain main ✗ curl -L https://foundry.paradigm.xyz | bash
% Total % Received % Xferd Average Speed Time Time Time Current
Dload Upload Total Spent Left Speed
100 167 100 167 0 0 524 0 --:--:-- --:--:-- --:--:-- 526
100 2198 100 2198 0 0 3260 0 --:--:-- --:--:-- --:--:-- 3260
Installing foundryup...

Detected your preferred shell is bash and added foundryup to PATH.
Run 'source /home/delvo/.bashrc' or start a new terminal session to use foundryup.
Then, simply run 'foundryup' to install Foundry.

# Working with userDefinedData

The `userDefinedData` is mainly used in the frontend to allow users to pass in additional information during the time of verification. The data is passed into the `customVerificationHook` function on your `SelfVerificationRoot` contract, which can be used as desired to perform custom logic.

{% hint style="warning" %}
The `userDefinedData` passed in the QRCode gets converted from a **string** to **bytes**. You will have to convert it back from bytes to a string again and work on top of that.
{% endhint %}

One use case that `userDefinedData` can be used for is to define what disclosures the user is asked to provide. In the example below, the `userDefinedData` is used create a key that maps to a particular setup of the verification config.

## Setting a config

When setting a config just creating the config is not enough. You should register the config with the hub and this method will also return the config id.

```solidity
//internal map that stores from hash(data) -> configId
mapping(uint256 => uint256) public configs;

function setConfig(
    string memory configDesc,
    SelfUtils.UnformattedVerificationConfigV2 config
) public {
    //create the key
    uint256 key = uint256(keccak256(bytes(configDesc)));
    //create the hub compliant config struct
    SelfStructs.VerificationConfigV2 verificationConfig =
        SelfUtils.formatVerificationConfigV2(_verificationConfig);
    //register and get the id
    uint256 verificationConfigId =
        IIdentityVerificationHubV2(identityVerificationHubV2Address)
        .setVerificationConfigV2(verificationConfig);
    //set it in the key
    configs[key] = verificationConfigId;
}
```

### Change the `getConfigId` in the `SelfVerificationRoot`

Now we just have to change the `getConfigId` that returns the config ids from this map. This is pretty simple as now we just have to hash the existing bytes:

```solidity
function getConfigId(
    bytes32 destinationChainId,
    bytes32 userIdentifier,
    bytes memory userDefinedData
) public view virtual returns (bytes32) {
    //the string is already converted to bytes
    uint256 key = keccak256(userDefinedData);
    return configs[key];
}
```
