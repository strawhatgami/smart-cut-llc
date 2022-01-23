# Smart cuts in Losslesscut
This script emulates a "smart cut" feature for Losslesscut (https://github.com/mifi/lossless-cut), by adding keyframes where they are needed in the input video.

## Install
Install Node.JS if you don't have it yet (> v14): https://nodejs.dev/download/

Install FFmpeg if you don't have it yet: https://www.ffmpeg.org/download.html

Then do:
```
git clone https://github.com/strawhatgami/smart-cut-llc.git # Clone this repo
cd smart-cut-llc; npm install # Install the dependencies
```
Script is ready to use.

## Usage
1. Do the cuts of your video in Losslesscut as usual, just don't export the videos you want.

2. Locate the Losslesscut project file the software generated (export it if needed), then run sth like:
```
node adjust-key-frames.js <losslesscut-project.llc>
```
This will generate two files: a new video and a new .llc file.

3. Import the new .llc (something like `<project basename>-adjusted-keys.llc`) in Losslesscut: it contains your previous cuts, but the video used is a copy of the previous project one, with keyframes sets at the start of your previous cuts.

4. Export the cuts: the keyframes are at the right places to do smart cuts of your cuts. Your videos cuts will start normally in your media player wherever you decide they start in the video they are extracted from.

## Notes and caveats
The script take some time, depending of your video size (and format?): it fully reencodes it.

The video used for the cuts is reencoded from the old one, thus it may have a quality loss; most of the time it won't, but you should test it to ensure it suits your needs.

You can safely clean the generated video and .llc files after your video exports.

I did this script firstly for my personal use, and it is tested only in my use case (video format, size, intended use, ...) and environment (ubuntu 20.04, Losslesscut v3.39.0, shell, ...). Please notice that, as most softwares in this case, you can encounter bugs.

## Motivations
I discovered Losslesscut and recently cut hundreds of videos scenes, thanks to this very handy and useful software.

However I quickly observed that a part of my cuts (done on mp4 and mov files, with "exact cut") have their first seconds broken (ugly and meaningless pictures). I tried first to make broader cut segments (with "keyframes cut"), but unwanted scenes appeared in my videos; then I used ffmpeg to add keyframes more regularly in the video, and after that to add keyframes at moments I manually selected. All of those solutions take at least a huge time overhead I want to avoid.

The perfect solution would be to add a smart cut option in Losslesscut, but this is not going to happen soon (at the time of this write): https://github.com/mifi/lossless-cut/issues/126 .
Moreover, this solution may cause issues against the base idea behind the software: provide lossless (and fast) cuts; this is because at least a part of the images of the wanted cuts need to be reencoded to look nice in a player, thus leading to potential loss (and a heavy processing that takes time).

So I ended up with the tradeoff of creating a process automating the keyframes insertion where I need them, using the Losslesscut project file that contains my cuts start and end time.
