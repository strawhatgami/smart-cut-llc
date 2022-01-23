import fs from "fs/promises";
import JSON5 from "json5";
import { dirname, join } from "path";
import shellEscape from "shell-escape";
import child_process from 'child_process';
const {spawn} = child_process;

const suffix = "-adjusted-keyframes";

const parseArgs = (argv) => {
  const parsed = {};

  if (argv.length < 3) return {error: true};
  if (!argv[0].match(/node$/)) return {error: true};
  if (!argv[2] || !argv[2].match(/.llc$/)) return {error: true};

  parsed.input_llc_path = argv[2];

  return parsed;
}

const usage = (argv) => {
  const script_name = argv[1] || "<script>";
  console.log("Usage:");
  console.log(`node ${script_name} <file.llc>`);
}

const loadLlcFile = async (llc_pathname) => {
  const data = await fs.readFile(join(process.cwd(), llc_pathname));
  const text = data.toString();
  const res = JSON5.parse(text);
  return res;
}

const inputVideoPath = (video_rel_pathname, llc_pathname) => {
  const pathname = join(process.cwd(), dirname(llc_pathname), video_rel_pathname);
  return pathname;
}

const keyframesTs = (segments) => {
  const timestamps = segments.map(({start}) => start);

  return timestamps;
}

const prepareVideoGenerationCmd = (input, output, keyframes_timestamps) => {
  // Doc for "-force_key_frames" at https://ffmpeg.org/ffmpeg.html#Advanced-Video-options
  const cmd = [
    "ffmpeg",
    "-y",
    "-i", input, 
    "-force_key_frames", keyframes_timestamps.join(","),
    output,
  ];
  
  return cmd;
}

const execCmdWrapper = (cmd) => {
  return new Promise((res, rej) => {
    const executable = cmd.shift();
    const spawned = spawn(executable, cmd);

    spawned.stdout.on("data", (data) => console.log(data.toString()) );
    spawned.stderr.on("data", (data) => console.error(data.toString()) );

    spawned.on('exit', (code) => {
      if (code != 0) {
        console.log("=> Execution failed, with return code", code);
        rej();
      }

      console.log("=> Execution successful");
      res();
    });
  })
}

/*
function run(cmd, callback) {
  var spawn = require('child_process').spawn;
  var command = spawn(cmd);
  var result = '';
  command.stdout.on('data', function(data) {
       result += data.toString();
  });
  command.on('close', function(code) {
      return callback(result);
  });
}
*/

const addSuffix = (path, suffix, label_error) => {
  const chunks = path.split(".");
  if (!chunks.length >= 2) {
    throw new Error(label_error + "filename has no extension");
  }

  const project_name = chunks[chunks.length - 2];
  chunks[chunks.length - 2] = project_name + suffix;
  const pathname = chunks.join(".");

  return pathname;
}

const generateLlcFile = async (input_llc_data, input_llc_path) => {
  const output_llc_path = addSuffix(input_llc_path, suffix, "llc");
  console.log("New LLC file will be written at:", output_llc_path);

  const data = {
    ...input_llc_data,
    mediaFileName: addSuffix(input_llc_data.mediaFileName, suffix, "mediaFileName"),
  };
  const text = JSON5.stringify(data, null, 2);
  await fs.writeFile(output_llc_path, text);
}

const main = async () => {
  const {input_llc_path, error} = parseArgs(process.argv);
  if (error) {
    usage(process.argv);
    return;
  };

  const input_llc_data = await loadLlcFile(input_llc_path);
  const {mediaFileName: raw_input_video_path, cutSegments} = input_llc_data;

  const input_video_path = inputVideoPath(raw_input_video_path, input_llc_path);
  const output_video_path = addSuffix(input_video_path, suffix, "llc mediaFileName video");
  const keyframes_timestamps = keyframesTs(cutSegments);

  const cmd = prepareVideoGenerationCmd(input_video_path, output_video_path, keyframes_timestamps);
  console.log("Running:\n" + shellEscape(cmd));
  await execCmdWrapper(cmd);

  await generateLlcFile(input_llc_data, input_llc_path, output_video_path);
}

main();
