import "dart:io";

final BASE_DIR = new Path.raw("dart");
final BUILD_DIR = new Path.raw("build");

final List<String> WATCHED_FILES = [
  "main.dart",
  "clock.dart"
];

bool get isWindows => Platform.operatingSystem == 'windows';
Path get sdkBinPath => new Path(new Options().executable).directoryPath;
Path get dart2jsPath => sdkBinPath.append(isWindows ? 'dart2js.bat' : 'dart2js');

/// This quick and dirty build script watches for changes to any .dart files
/// and re-compiles chrome.dart using dart2js. The --disallow-unsafe-eval
/// flag causes dart2js to output CSP (and Chrome app) friendly code.
void main() {
  var args = new Options().arguments;

  bool fullBuild = args.contains("--full");
  bool dartFilesChanged = args.any(
      (arg) => arg.startsWith("--changed=") && arg.endsWith(".dart"));

  if (fullBuild || dartFilesChanged) {
    WATCHED_FILES.forEach((path) {
      callDart2js(path);
    });
  }
}

void callDart2js(String file) {

  var path = BASE_DIR.append(file).toNativePath();
  var out = BUILD_DIR.append(file).toNativePath();

  print("dart2js --disallow-unsafe-eval -o${out}.js ${path}");

  Process.run(dart2jsPath.toNativePath(),
    ['--disallow-unsafe-eval', '-o${out}.js', path]
  ).then((result) {
    if (result.stdout.length > 0) {
      print("${result.stdout.replaceAll('\r\n', '\n')}");
    }

    if (result.exitCode != 0) {
      exit(result.exitCode);
    }
  });
}
