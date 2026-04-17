import fs from "fs";
import os from "os";
import { execSync } from "child_process";
import nodemailer from "nodemailer";
import "dotenv/config";

const FILE = "/data/last_seen.txt";

// Get system boot time
function getBootTime() {
  const uptime = fs.readFileSync("/proc/uptime", "utf8").split(" ")[0];
  const seconds = parseFloat(uptime);
  return Date.now() - seconds * 1000;
}

// Read last heartbeat
function getLastSeen() {
  if (!fs.existsSync(FILE)) return null;
  return parseInt(fs.readFileSync(FILE, "utf8"));
}

// Save heartbeat
function saveNow() {
  fs.writeFileSync(FILE, Date.now().toString());
}

// Send email
async function sendEmail(downtimeMs) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const minutes = Math.round(downtimeMs / 60000);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "Power Outage Detected",
    text: `Power was out for ~${minutes} minutes`,
  });
}

async function main() {
  const bootTime = getBootTime();
  const lastSeen = getLastSeen();

  if (lastSeen) {
    const downtime = bootTime - lastSeen;

    if (downtime > 60000) { // ignore tiny gaps
      console.log("Power outage detected:", downtime);
      await sendEmail(downtime);
    }
  }

  // Heartbeat loop
  setInterval(() => {
    saveNow();
  }, 30000);
}

main();