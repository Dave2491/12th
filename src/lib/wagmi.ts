import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { xLayerTestnet } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Twelfth",
  // Replace "demo" with a real WalletConnect Cloud project ID from cloud.walletconnect.com
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
  chains: [xLayerTestnet],
  ssr: true,
});
