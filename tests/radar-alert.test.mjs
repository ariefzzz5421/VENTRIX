import { test } from "node:test";
import { strict as assert } from "node:assert";
import { toSignal } from "../lib/radar.ts";
import { publicLaunchEmbed } from "../lib/radar-delivery.ts";

const now = Date.parse("2026-10-31T08:00:00.000Z");
const base = {
  objectID: "123456",
  title: "Show HN: ClipSmith – AI video editor",
  url: "https://clipsmith.example",
  author: "maker42",
  created_at: "2026-10-30T10:00:00.000Z",
  points: 42,
  num_comments: 8,
};

test("launch alert shows sourced links, builder, summary, and time without a footer", () => {
  const signal = toSignal({
    ...base,
    story_text: '<p>I built ClipSmith to edit short videos from text prompts. Demo: <a href="https://github.com/maker42/clipsmith">code</a> and <a href="https://x.com/clipsmith">updates</a>.</p>',
  }, now);
  assert.ok(signal);
  assert.equal(signal.builder, "maker42");
  assert.equal(signal.projectType, "Video editor");
  assert.match(signal.summary, /edit short videos/);
  const embed = publicLaunchEmbed(signal);
  assert.equal(embed.footer, undefined);
  assert.equal(embed.timestamp, base.created_at);
  assert.match(embed.fields.find(field => field.name === "Links").value, /🐙 \[GitHub\]/u);
  assert.match(embed.fields.find(field => field.name === "Links").value, /𝕏 \[X\]/u);
  assert.match(embed.fields.find(field => field.name === "Links").value, /🌐 \[Website\]/u);
  assert.match(embed.fields.find(field => field.name === "Links").value, /💬 \[Show HN\]/u);
});

test("a submitter is not presented as a builder without first-person evidence", () => {
  const signal = toSignal({ ...base, story_text: "A useful AI editor I found online. Inspired by https://github.com/other/example" }, now);
  assert.ok(signal);
  assert.equal(signal.builder, null);
  assert.equal(signal.socialLinks.length, 0);
  assert.equal(publicLaunchEmbed(signal).fields.some(field => field.name === "Builder (HN)"), false);
});

test("a personal introduction does not replace the product summary or type", () => {
  const signal = toSignal({
    ...base,
    title: "Show HN: Lasm – Write formally verified webapps in Lean for Node/serverless/edge",
    story_text: "Lasm has been my dream for a good part of 2026. This AI developer tool creates verified webapps.",
  }, now);
  assert.ok(signal);
  assert.equal(signal.projectType, "Developer tool");
  assert.match(signal.summary, /Write formally verified webapps/);
});
