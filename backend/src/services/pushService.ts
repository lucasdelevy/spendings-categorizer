import http2 from "node:http2";
import { importPKCS8, SignJWT } from "jose";
import { deleteDevice } from "./deviceService.js";
import type { DeviceRecord, LimitPeriod } from "../types.js";

const INVALID_REASONS = new Set(["Unregistered", "BadDeviceToken", "ExpiredToken", "DeviceTokenNotForTopic"]);

let cachedJwt: { token: string; expiresAt: number } | null = null;

function apnsKeyPem(): string | null {
  const raw = process.env.APNS_KEY_P8 || "";
  if (!raw.trim()) return null;
  if (raw.includes("BEGIN PRIVATE KEY")) {
    return raw.replace(/\\n/g, "\n");
  }
  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.APNS_KEY_ID && apnsKeyPem());
}

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.expiresAt - 60 > now) return cachedJwt.token;

  const pem = apnsKeyPem();
  const keyId = process.env.APNS_KEY_ID || "";
  const teamId = process.env.APNS_TEAM_ID || "B2P4VVXRT2";
  if (!pem || !keyId) throw new Error("APNs is not configured");

  const key = await importPKCS8(pem, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 50 * 60)
    .sign(key);

  cachedJwt = { token, expiresAt: now + 50 * 60 };
  return token;
}

function periodLabel(period: LimitPeriod, locale: string): string {
  const pt = locale.toLowerCase().startsWith("pt");
  if (period === "daily") return pt ? "diário" : "daily";
  if (period === "weekly") return pt ? "semanal" : "weekly";
  return pt ? "mensal" : "monthly";
}

export function alertCopy(
  locale: string,
  category: string,
  percent: number,
  period: LimitPeriod,
): { title: string; body: string } {
  const pt = locale.toLowerCase().startsWith("pt");
  const label = periodLabel(period, locale);
  if (pt) {
    return {
      title: "Aletheia",
      body: `${category} está em ${percent}% do limite ${label}`,
    };
  }
  return {
    title: "Aletheia",
    body: `${category} is at ${percent}% of its ${label} limit`,
  };
}

interface ApnsResult {
  status: number;
  reason?: string;
}

function sendApns(
  client: http2.ClientHttp2Session,
  jwt: string,
  token: string,
  payload: Record<string, unknown>,
): Promise<ApnsResult> {
  const topic = process.env.APNS_BUNDLE_ID || "com.lucasdelevy.aletheia";
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let chunks = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      chunks += chunk;
    });
    req.on("end", () => {
      let reason: string | undefined;
      if (chunks) {
        try {
          reason = (JSON.parse(chunks) as { reason?: string }).reason;
        } catch {
          reason = chunks.slice(0, 200);
        }
      }
      resolve({ status, reason });
    });
    req.on("error", reject);
    req.end(body);
  });
}

export async function sendLimitAlerts(
  devices: DeviceRecord[],
  alerts: Array<{ category: string; percent: number; period: LimitPeriod; yearMonth: string }>,
): Promise<number> {
  if (devices.length === 0 || alerts.length === 0) return 0;
  if (!isPushConfigured()) {
    console.warn("Skipping push: APNS_KEY_ID / APNS_KEY_P8 are not set");
    return 0;
  }

  const production = (process.env.APNS_PRODUCTION || "false").toLowerCase() === "true";
  const host = production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const jwt = await getApnsJwt();
  const client = http2.connect(`https://${host}`);

  try {
    let sent = 0;
    for (const alert of alerts) {
      for (const device of devices) {
        const { title, body } = alertCopy(device.locale, alert.category, alert.percent, alert.period);
        const payload = {
          aps: {
            alert: { title, body },
            sound: "default",
          },
          category: alert.category,
          percent: alert.percent,
          yearMonth: alert.yearMonth,
        };
        try {
          const result = await sendApns(client, jwt, device.token, payload);
          if (result.status === 200) {
            sent += 1;
            continue;
          }
          console.warn(
            `APNs ${result.status} ${result.reason ?? ""} token=${device.token.slice(0, 8)}…`,
          );
          if (result.reason && INVALID_REASONS.has(result.reason)) {
            const userId = device.PK.startsWith("USER#") ? device.PK.slice(5) : "";
            if (userId) await deleteDevice(userId, device.token);
          }
        } catch (err) {
          console.error("APNs send failed:", err);
        }
      }
    }
    return sent;
  } finally {
    client.close();
  }
}

export function reminderCopy(locale: string, name: string): { title: string; body: string } {
  const pt = locale.toLowerCase().startsWith("pt");
  if (pt) {
    return { title: "Aletheia", body: `${name} vence hoje` };
  }
  return { title: "Aletheia", body: `${name} is due today` };
}

export async function sendReminderPushes(
  devices: DeviceRecord[],
  reminder: { reminderId: string; name: string; yearMonth: string },
): Promise<number> {
  if (devices.length === 0) return 0;
  if (!isPushConfigured()) {
    console.warn("Skipping reminder push: APNS_KEY_ID / APNS_KEY_P8 are not set");
    return 0;
  }

  const production = (process.env.APNS_PRODUCTION || "false").toLowerCase() === "true";
  const host = production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const jwt = await getApnsJwt();
  const client = http2.connect(`https://${host}`);

  try {
    let sent = 0;
    for (const device of devices) {
      const { title, body } = reminderCopy(device.locale, reminder.name);
      const payload = {
        aps: {
          alert: { title, body },
          sound: "default",
        },
        type: "payment-reminder",
        reminderId: reminder.reminderId,
        yearMonth: reminder.yearMonth,
      };
      try {
        const result = await sendApns(client, jwt, device.token, payload);
        if (result.status === 200) {
          sent += 1;
          continue;
        }
        console.warn(
          `APNs ${result.status} ${result.reason ?? ""} token=${device.token.slice(0, 8)}…`,
        );
        if (result.reason && INVALID_REASONS.has(result.reason)) {
          const userId = device.PK.startsWith("USER#") ? device.PK.slice(5) : "";
          if (userId) await deleteDevice(userId, device.token);
        }
      } catch (err) {
        console.error("APNs reminder send failed:", err);
      }
    }
    return sent;
  } finally {
    client.close();
  }
}
