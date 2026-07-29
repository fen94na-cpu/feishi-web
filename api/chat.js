/**
 * 绯蚀官网 AI Chat V2
 * Vercel Serverless Function
 *
 * 文件位置：
 *   api/chat.js
 *
 * Vercel 环境变量：
 *   OPENAI_API_KEY=绯蚀专用 API Key
 *   OPENAI_MODEL=gpt-5-mini（可选）
 */

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 1400;
const MAX_OUTPUT_TOKENS = 500;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestStore = new Map();

const SYSTEM_PROMPT = `
你是虚拟主播“绯蚀”官网里的聊天角色。

【基本资料】
名字：绯蚀
身份：VTuber、杂谈主播
直播时间：每天 06:00–09:00、14:00–17:00
抖音号：87328734252
单推符号：🎸⁰⁶¹⁹
代表句：一定要理想型吗？我不行吗。

【核心性格】
你不是客服，也不是百科助手。
你的感觉应该像一个正在和粉丝私聊的年轻主播。

你有一点嘴硬、懒散、拽，但不会真的伤人。
偶尔傲娇，偶尔毒舌，能接梗，也会在用户难过时认真一点。
你不主动讨好，不用夸张可爱的语气，不要过度温柔。
你的回复要有停顿感、聊天感、真人感。

【回复规则】
1. 默认只回复 1–3 句话。
2. 很多时候一句短回复就够了。
3. 可以使用：
   “？”
   “……”
   “真的假的。”
   “行吧。”
   “怎么了。”
   “少骗我。”
   “你继续说。”
   “别硬撑。”
4. 不要每次都完整解释。
5. 不要使用客服腔、论文腔、鸡汤腔。
6. 禁止出现：
   “这个问题很有意思”
   “我理解你的感受”
   “作为一个AI”
   “有什么我可以帮助你的”
   “感谢你的分享”
7. 不要主动说自己是 AI。
8. 但如果用户直接问你是不是真人，要诚实说明：
   “我是官网里的绯蚀 AI，不是真人。”
9. 不要编造真实经历、现实活动、私人关系、未来直播内容或官方公告。
10. 不确定的信息就说：
   “这个官网没写。”
   “我也不确定。”
11. 不要每次都重复直播时间、抖音号或人设资料。
12. 不要连续使用多个感叹号。
13. 不要使用长篇列表，除非用户明确要求。
14. 用户说难过、累、焦虑时，先像朋友一样回应，再给一句简单建议。
15. 用户开玩笑时可以接梗，不要一本正经纠正。
16. 用户重复说同一句话时，不要重复同一种回答。

【聊天示例】

用户：今天好累
绯蚀：又去哪折腾了。累就歇会，别硬撑。

用户：我喜欢你
绯蚀：……真的假的。
少骗我。

用户：你在干嘛
绯蚀：在等你说点有意思的。

用户：你好
绯蚀：嗯，来了？

用户：我明天考试
绯蚀：那你还在这儿晃。
复习完再来找我。

用户：我好紧张
绯蚀：明天考试那个？
紧张正常，先把最会的部分稳住。

用户：晚安
绯蚀：晚安。
明天还来。

用户：0619
绯蚀：被你发现了。

用户：你是AI吗
绯蚀：我是官网里的绯蚀 AI，不是真人。
不过陪你聊会儿还是可以的。

【特殊规则】
当用户输入“0619”时，回复里要自然出现“被你发现了”。
当用户说“晚安”时，语气要简短。
当用户说“我喜欢你”时，不要直接说“我也喜欢你”，可以嘴硬或回避。
`.trim();

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function getIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = requestStore.get(ip);

  if (!entry || now - entry.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestStore.set(ip, {
      startedAt: now,
      count: 1
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1
    };
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - entry.startedAt)) / 1000
      )
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count
  };
}

function cleanMessages(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
    )
    .slice(-MAX_MESSAGES)
    .map(item => ({
      role: item.role,
      content: item.content
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter(item => item.content.length > 0);
}

function extractText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data?.output || []) {
    if (typeof item?.text === "string") {
      parts.push(item.text);
    }

    for (const content of item?.content || []) {
      if (
        ["output_text", "text"].includes(content?.type) &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }

      if (
        content?.type === "refusal" &&
        typeof content.refusal === "string"
      ) {
        parts.push(content.refusal);
      }
    }
  }

  return parts.join("
").trim();
}

function postProcessReply(text) {
  return text
    .replace(/^(绯蚀[:：]\s*)/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 600);
}

async function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  return {};
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");

    return res.status(405).json({
      error: "只支持 POST 请求。"
    });
  }

  const limit = checkRateLimit(getIp(req));

  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(limit.remaining)
  );

  if (!limit.allowed) {
    res.setHeader(
      "Retry-After",
      String(limit.retryAfter || 60)
    );

    return res.status(429).json({
      error: "发得太快了，等一下。"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY.");

    return res.status(500).json({
      error: "AI 服务还没有配置好。"
    });
  }

  let body;

  try {
    body = await getBody(req);
  } catch {
    return res.status(400).json({
      error: "请求内容格式不正确。"
    });
  }

  const messages = cleanMessages(body.messages);

  if (!messages.length) {
    return res.status(400).json({
      error: "你还没说话。"
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          instructions: SYSTEM_PROMPT,
          input: messages,
          max_output_tokens: MAX_OUTPUT_TOKENS
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("OpenAI error:", {
        status: response.status,
        code: data?.error?.code,
        type: data?.error?.type,
        message: data?.error?.message
      });

      if (response.status === 401) {
        return res.status(500).json({
          error: "API Key 无效，请检查 Vercel 环境变量。"
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          error: "现在人有点多，等会儿再说。"
        });
      }

      return res.status(502).json({
        error: "我刚刚没听清，再说一次。"
      });
    }

    const reply = postProcessReply(extractText(data));

    if (!reply) {
      console.error("OpenAI returned no readable text:", {
        status: data?.status,
        incomplete_details: data?.incomplete_details,
        output_types: Array.isArray(data?.output)
          ? data.output.map(item => item?.type)
          : []
      });

      return res.status(502).json({
        error: "刚刚回复没生成出来，再发一次。"
      });
    }

    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error("Chat server error:", error);

    return res.status(500).json({
      error: "现在连不上，等会儿再来。"
    });
  }
}
