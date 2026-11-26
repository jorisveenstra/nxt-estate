import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);
Config.setCrf(25);
Config.setPixelFormat("yuv420p");
