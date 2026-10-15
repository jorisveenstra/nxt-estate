import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);
Config.setCrf(24);
Config.setPixelFormat("yuv420p");
Config.setMuted(true); // audio (voice-over + muziek) wordt in scripts/mix.sh onder de beelden gezet
