import theblockchainapi from 'theblockchainapi';

let defaultClient = theblockchainapi.ApiClient.instance;

// Get a free API Key Pair here: https://dashboard.blockchainapi.com/api-keys

let APIKeyID = defaultClient.authentications['APIKeyID'];
APIKeyID.apiKey = 'API-KEY-ID';

let APISecretKey = defaultClient.authentications['APISecretKey'];
APISecretKey.apiKey = 'API-SECRET-KEY';

//// First, we create a wallet, get an airdrop three times, and then use that airdrop to create a test candy machine.

// Let's create a new wallet with a balance of 0.

// First, generate a new seed phrase.

let apiInstance = new theblockchainapi.SolanaWalletApi();

const new_seed_phrase = await apiInstance.solanaGenerateSecretRecoveryPhrase().then((data) => {
    return data['secret_recovery_phrase'];
}, (error) => {
    console.error(error);
    return null;
});
console.log("New Seed Phrase: ", new_seed_phrase);

// Then, derive a public key owned by the seed phrase.

let getPublicKeyRequest = new theblockchainapi.GetPublicKeyRequest(); // GetPublicKeyRequest | 
getPublicKeyRequest.wallet = {
  secret_recovery_phrase: new_seed_phrase
};

const public_key = await apiInstance.solanaDerivePublicKey(getPublicKeyRequest).then((data) => {
  console.log('API called successfully.');
  return data['public_key'];
}, (error) => {
  console.error(error);
  return null;
});

console.log("Public Key: ", public_key);

// Finally, get the balance of that public key on the devnet, measured in SOL (not LAMPORT, 1e9 LAMPORT in 1 SOL)

const balance_request = new theblockchainapi.BalanceRequest(); // BalanceRequest | 
balance_request.public_key = public_key;
balance_request.network = 'devnet';
balance_request.unit = 'sol';

let opts = {
  'balanceRequest': balance_request
};

async function getBalance() {
    const balance_result = await apiInstance.solanaGetBalance(opts).then((data) => {
        console.log('API called successfully.');
        return data;
    }, (error) => {
        console.error(error);
        return error;
    });
    
    console.log("Balance Retrieved: ", balance_result);
}

// Get the balance before the airdrop
await getBalance();

// Now get an airdrop
for (let i = 0; i < 3; i++) {
    const airdrop_request = new theblockchainapi.AirdropRequest();
    airdrop_request.recipient_address = public_key;
    
    const tx_sig = await apiInstance.solanaGetAirdrop({
        'airdropRequest': airdrop_request
      }).then((data) => {
      console.log('API called successfully.');
      return data['transaction_signature'];
    }, (error) => {
      console.error(error);
      return null;
    });
    console.log("You can view the Airdrop transaction here: https://explorer.solana.com/tx/" + tx_sig + "?cluster=devnet");
    console.log(airdrop_request);
}

// Get the balance after the airdrop
await getBalance();

// Now mint the NFT
// We need to make sure the airdrops have time to process before creating the candy machine
await new Promise(r => setTimeout(r, 30000));

const candy_request = new theblockchainapi.CreateTestCandyMachineRequest(); // CreateTestCandyMachineRequest |
candy_request.wallet = {
  secret_recovery_phrase: new_seed_phrase
};
candy_request.candy_machine_contract_version = 'v2';

let candyApiInstance = new theblockchainapi.SolanaCandyMachineApi();
opts = {
  'createTestCandyMachineRequest': candy_request
};

const candy_machine_id = await candyApiInstance.solanaCreateTestCandyMachine(opts).then((data) => {
  console.log('API called successfully.');
  return data['candy_machine_id']
}, (error) => {
  console.error(error);
  return null;
});

console.log(
    "Here is the candy machine ID for a v2 candy machine. You can now mint from this using the ID (See our 'Mint from Candy Machine' endpoint): ", candy_machine_id
)

