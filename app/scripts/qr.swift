// Writes a QR code for each open-source project with a `qr` name in
// `src/contents/site.json` to `src/assets/qr/<qr>.png`, one pixel per module,
// pointing at the project's first link. Core Image adds a one-module white border;
// the standard asks for four, so the sticker's padding supplies the rest.
// `src/assets/qr/targets.json` records the link in each code, so the build can tell
// when site.json has moved on and the codes need regenerating.
//
//   npm run qr-codes
//   swift scripts/qr.swift [app-directory]
//
// Without an argument it uses the app directory this script belongs to. It uses
// Core Image, so it runs on macOS only; the codes are committed.
import CoreImage
import CoreImage.CIFilterBuiltins
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data("\(message)\n".utf8))
  exit(1)
}

let arguments = CommandLine.arguments
let root = arguments.count > 1
  ? URL(fileURLWithPath: arguments[1])
  : URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
let contentURL = root.appendingPathComponent("src/contents/site.json")
let outputDir = root.appendingPathComponent("src/assets/qr")

let json: Any
do {
  json = try JSONSerialization.jsonObject(with: Data(contentsOf: contentURL))
} catch {
  fail("Could not read \(contentURL.path): \(error.localizedDescription)")
}
guard
  let content = json as? [String: Any],
  let home = content["home"] as? [String: Any],
  let openSource = home["openSource"] as? [String: Any],
  let projects = openSource["projects"] as? [[String: Any]]
else {
  fail("Unexpected shape of \(contentURL.path)")
}

// Every code is rendered before the folder is touched, so a bad entry leaves the
// committed codes as they were.
let context = CIContext()
var codes: [(name: String, href: String, image: CGImage)] = []
for project in projects {
  guard let name = project["qr"] as? String else { continue }
  guard
    let links = project["links"] as? [[String: Any]],
    let href = links.first?["href"] as? String
  else {
    fail("The project with qr \"\(name)\" has no first link to encode")
  }

  let filter = CIFilter.qrCodeGenerator()
  filter.message = Data(href.utf8)
  filter.correctionLevel = "M"
  guard let image = filter.outputImage, let code = context.createCGImage(image, from: image.extent) else {
    fail("Could not render a QR code for \(href)")
  }
  codes.append((name: name, href: href, image: code))
}

do {
  // Old codes go first, so a removed or renamed project leaves no orphan behind.
  let fileManager = FileManager.default
  try fileManager.createDirectory(at: outputDir, withIntermediateDirectories: true)
  for file in try fileManager.contentsOfDirectory(at: outputDir, includingPropertiesForKeys: nil)
  where file.pathExtension == "png" {
    try fileManager.removeItem(at: file)
  }

  var targets: [String: String] = [:]
  for code in codes {
    let url = outputDir.appendingPathComponent("\(code.name).png")
    guard
      let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)
    else {
      fail("Could not write \(url.path)")
    }
    CGImageDestinationAddImage(destination, code.image, nil)
    guard CGImageDestinationFinalize(destination) else { fail("Could not write \(url.path)") }
    targets[code.name] = code.href
    print("\(code.name).png \(code.image.width)×\(code.image.height) → \(code.href)")
  }

  // Laid out the way Prettier formats JSON, so `npm run format` leaves it as it is.
  let encoder = JSONEncoder()
  encoder.outputFormatting = .withoutEscapingSlashes
  func quote(_ string: String) throws -> String { String(decoding: try encoder.encode(string), as: UTF8.self) }
  let entries = try targets.sorted { $0.key < $1.key }.map { "  \(try quote($0.key)): \(try quote($0.value))" }
  let targetsURL = outputDir.appendingPathComponent("targets.json")
  try Data("{\n\(entries.joined(separator: ",\n"))\n}\n".utf8).write(to: targetsURL)
} catch {
  fail("Could not write to \(outputDir.path): \(error.localizedDescription)")
}
