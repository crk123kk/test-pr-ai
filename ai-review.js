import fs from "fs";
import { Octokit } from "@octokit/rest";

// 1. 读取 diff（限制长度）
const diff = fs.readFileSync("diff.txt", "utf8").slice(0, 8000);

console.log("AI REVIEW SCRIPT VERSION:", new Date().toISOString());

// 2. 构造 Prompt（极简）
const prompt = `
你是一个资深前端工程师，请 Review 以下 PR 的代码变更。

只指出：
- 潜在 bug
- 不合理的写法
- 可以改进的地方

用中文，分点列出。

代码 diff：
${diff}
`;

// 3. 调 DeepSeek API
const res = await fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  })
});

const data = await res.json();
const reviewText = data.choices[0].message.content;

// 4. 解析 PR 信息
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const prNumber = process.env.GITHUB_REF.match(/refs\/pull\/(\d+)/)[1];

// 5. 评论到 PR
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

await octokit.issues.createComment({
  owner,
  repo,
  issue_number: prNumber,
  body: `🤖 **DeepSeek AI Review（MVP）**\n\n${reviewText}`
});
