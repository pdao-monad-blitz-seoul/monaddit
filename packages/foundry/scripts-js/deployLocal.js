import { config } from "dotenv";
import { execSync } from "child_process";

// Load environment variables
config();

const rpcUrl = process.env.LOCAL_RPC_URL || "http://localhost:8545";
const privateKey = process.env.LOCAL_PRIVATE_KEY;

if (!privateKey) {
  console.error("LOCAL_PRIVATE_KEY not found in .env file");
  process.exit(1);
}

const command = `forge script script/Deploy.s.sol --rpc-url ${rpcUrl} --private-key ${privateKey} --broadcast`;

console.log("Deploying to local network...");
console.log(`RPC URL: ${rpcUrl}`);

try {
  execSync(command, { stdio: "inherit", cwd: process.cwd() });
} catch (error) {
  console.error("Deployment failed:", error.message);
  process.exit(1);
}