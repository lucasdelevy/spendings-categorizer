#!/usr/bin/env node
/**
 * Applies native build patches for Xcode 26 (fmt, expo-localization).
 * Re-run after `expo prebuild --clean` or `npm install`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(fileURLToPath(import.meta.url));
const iosRoot = path.join(root, "..");

function patchExpoLocalization() {
  const swift = path.join(
    iosRoot,
    "..",
    "node_modules",
    "expo-localization",
    "ios",
    "LocalizationModule.swift",
  );
  if (!fs.existsSync(swift)) return;

  let content = fs.readFileSync(swift, "utf8");
  let changed = false;

  const calendarMarker = "@unknown default:";
  if (!content.includes(calendarMarker)) {
    const needle = `    case .iso8601:
      return "iso8601"
    }`;
    const replacement = `    case .iso8601:
      return "iso8601"
    @unknown default:
      return "iso8601"
    }`;

    if (!content.includes(needle)) {
      console.error("Unexpected LocalizationModule.swift layout; patch manually.");
      process.exit(1);
    }

    content = content.replace(needle, replacement);
    changed = true;
    console.log("Patched expo-localization for iOS 26 calendar identifiers.");
  }

  const tempMarker = "iOS 26 workaround: skip MeasurementFormatter";
  if (!content.includes(tempMarker)) {
    const tempNeedle = `  static func getTemperatureUnit() -> String? {
    let formatter = MeasurementFormatter()
    formatter.locale = Locale.current

    let temperature = Measurement(value: 0, unit: UnitTemperature.celsius)
    let formatted = formatter.string(from: temperature)

    guard let unitCharacter = formatted.last else {
      return nil
    }

    return unitCharacter == "F" ? "fahrenheit" : "celsius"
  }`;
    const tempReplacement = `  static func getTemperatureUnit() -> String? {
    // ${tempMarker} (ICU crash in NSUnitFormatter on iOS 26).
    return Locale.current.usesMetricSystem ? "celsius" : "fahrenheit"
  }`;

    if (!content.includes(tempNeedle)) {
      console.error("Unexpected getTemperatureUnit in LocalizationModule.swift; patch manually.");
      process.exit(1);
    }

    content = content.replace(tempNeedle, tempReplacement);
    changed = true;
    console.log("Patched expo-localization getTemperatureUnit for iOS 26.");
  }

  const textDirMarker = "iOS 26 workaround: characterDirection";
  if (!content.includes(textDirMarker)) {
    const textDirNeedle =
      '"textDirection": languageLocale.language.characterDirection == .rightToLeft ? "rtl" : "ltr",';
    const textDirReplacement = `"textDirection": Locale.characterDirection(forLanguage: languageTag) == .rightToLeft ? "rtl" : "ltr", // ${textDirMarker}`;

    if (!content.includes(textDirNeedle)) {
      console.error("Unexpected textDirection in LocalizationModule.swift; patch manually.");
      process.exit(1);
    }

    content = content.replace(textDirNeedle, textDirReplacement);
    changed = true;
    console.log("Patched expo-localization textDirection for iOS 26.");
  }

  if (changed) {
    fs.writeFileSync(swift, content);
  } else {
    console.log("expo-localization already patched for iOS 26.");
  }
}

patchExpoLocalization();

const podfilePatch = spawnSync("node", [path.join(root, "patch-podfile.mjs")], {
  stdio: "inherit",
});
process.exit(podfilePatch.status ?? 1);
