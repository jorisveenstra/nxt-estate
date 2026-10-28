import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setCrf(22);
Config.setX264Preset("medium");
Config.setConcurrency(2);
