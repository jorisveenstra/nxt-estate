import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(24);
Config.setPixelFormat("yuv420p");
Config.setMuted(true); // audio (VO + muziek) wordt in scripts/render.sh met ffmpeg gemixt
