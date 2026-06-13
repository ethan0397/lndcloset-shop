import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { products, categories, shipping, discounts, gallery, computeOrder } from "./products.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const VND = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

// Tra ve danh sach san pham + phan loai + cau hinh ship/giam gia cho frontend
app.get("/api/products", (req, res) => {
  res.json({ categories, products, shipping, discounts, gallery });
});

// Tao SMTP transporter neu da cau hinh day du
function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

function buildOrderHtml(order) {
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border:1px solid #eee">${it.name}</td>
        <td style="padding:8px;border:1px solid #eee">${it.color || "-"}</td>
        <td style="padding:8px;border:1px solid #eee">${it.size || "-"}</td>
        <td style="padding:8px;border:1px solid #eee;text-align:center">${it.qty}</td>
        <td style="padding:8px;border:1px solid #eee;text-align:right">${VND(it.price)}</td>
        <td style="padding:8px;border:1px solid #eee;text-align:right">${VND(it.price * it.qty)}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#5a4433">
    <h2 style="color:#a85f37">🧺 LnD clozet — Đơn hàng mới</h2>
    <h3>Thông tin khách</h3>
    <p>
      <b>Họ tên:</b> ${order.customer.name}<br/>
      <b>SĐT:</b> ${order.customer.phone}<br/>
      <b>Địa chỉ:</b> ${order.customer.address}<br/>
      <b>Ghi chú:</b> ${order.customer.note || "(không có)"}
    </p>
    <h3>Sản phẩm</h3>
    <table style="border-collapse:collapse;width:100%">
      <thead>
        <tr style="background:#fafafa">
          <th style="padding:8px;border:1px solid #eee;text-align:left">Sản phẩm</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Màu</th>
          <th style="padding:8px;border:1px solid #eee;text-align:left">Size</th>
          <th style="padding:8px;border:1px solid #eee">SL</th>
          <th style="padding:8px;border:1px solid #eee;text-align:right">Đơn giá</th>
          <th style="padding:8px;border:1px solid #eee;text-align:right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;margin-top:14px">
      <tr><td style="text-align:right;padding:2px 0">Tạm tính:</td>
        <td style="text-align:right;width:140px">${VND(order.subtotal)}</td></tr>
      <tr><td style="text-align:right;padding:2px 0">Phí vận chuyển:</td>
        <td style="text-align:right">${order.shippingFee === 0 ? "Miễn phí" : VND(order.shippingFee)}</td></tr>
      ${
        order.discountAmount > 0
          ? `<tr><td style="text-align:right;padding:2px 0">Giảm giá (${order.appliedCode}):</td>
              <td style="text-align:right;color:#2e7d32">- ${VND(order.discountAmount)}</td></tr>`
          : ""
      }
      <tr><td style="text-align:right;padding:8px 0;font-size:1.1rem"><b>Tổng cộng:</b></td>
        <td style="text-align:right;font-size:1.1rem;color:#a85f37"><b>${VND(order.total)}</b></td></tr>
    </table>
  </div>`;
}

// Ghep duong dan anh tuong doi thanh URL tuyet doi de Discord tai duoc
function absImage(img) {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return null; // localhost: Discord khong tai duoc anh
  return `${base}/${String(img).replace(/^\/+/, "")}`;
}

// Dinh dang ngay gio theo gio Viet Nam
function formatVNDate(iso) {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Dung noi dung thong bao gui len Discord
function buildDiscordPayload(order) {
  const lines = order.items
    .map(
      (it) =>
        `• ${it.name}${it.color ? " — " + it.color : ""} · Size ${it.size} × ${it.qty} = ${VND(it.price * it.qty)}`
    )
    .join("\n")
    .slice(0, 1024);

  const pay =
    `Tạm tính: ${VND(order.subtotal)}\n` +
    `Phí ship: ${order.shippingFee === 0 ? "Miễn phí" : VND(order.shippingFee)}\n` +
    (order.discountAmount > 0
      ? `Giảm giá (${order.appliedCode}): -${VND(order.discountAmount)}\n`
      : "") +
    `**TỔNG: ${VND(order.total)}**`;

  const fields = [
    { name: "🗓️ Ngày đặt", value: formatVNDate(order.createdAt) },
    { name: "👤 Khách hàng", value: `${order.customer.name}\n📞 ${order.customer.phone}` },
    { name: "🏠 Địa chỉ", value: order.customer.address || "-" },
    { name: "🛍️ Sản phẩm", value: lines || "-" },
    { name: "💰 Thanh toán", value: pay }
  ];
  if (order.customer.note) {
    fields.push({ name: "📝 Ghi chú", value: order.customer.note.slice(0, 1024) });
  }

  // Embed tong quan don hang
  const summary = {
    title: `Đơn từ ${order.customer.name}`,
    color: 0x2b86cf,
    fields,
    footer: { text: "LnD clozet · unique, cozy, you" },
    timestamp: order.createdAt
  };
  const firstImg = absImage(order.items[0] && order.items[0].image);
  if (firstImg) summary.thumbnail = { url: firstImg };

  // Moi san pham 1 embed kem anh thumbnail (Discord cho toi da 10 embed/tin)
  const itemEmbeds = order.items.slice(0, 9).map((it) => {
    const e = {
      color: 0x2b86cf,
      title: `🛍️ ${it.name}`,
      description:
        `${it.color ? `Mẫu: **${it.color}**\n` : ""}` +
        `Size: **${it.size}** · SL: **${it.qty}**\n` +
        `Giá: **${VND(it.price * it.qty)}**`
    };
    const url = absImage(it.image);
    if (url) e.thumbnail = { url };
    return e;
  });

  return {
    username: "LnD clozet",
    content: `🛒 **ĐƠN HÀNG MỚI** — ${VND(order.total)} 🎉`,
    embeds: [summary, ...itemEmbeds]
  };
}

async function sendDiscord(webhookUrl, order) {
  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDiscordPayload(order))
  });
  if (!resp.ok) {
    throw new Error(`Discord webhook trả về HTTP ${resp.status}`);
  }
}

app.post("/api/order", async (req, res) => {
  try {
    const { customer, items, discountCode } = req.body || {};
    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({ ok: false, error: "Thiếu thông tin khách hàng." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: "Giỏ hàng đang trống." });
    }

    // Tinh lai tien o server de chot dung gia (tranh sua tu client)
    const totals = computeOrder(items, discountCode);
    const order = { customer, items, ...totals, createdAt: new Date().toISOString() };

    // Luu lai don hang ra file de phong khi chua cau hinh email
    fs.appendFileSync(
      path.join(__dirname, "orders.log"),
      JSON.stringify(order) + "\n"
    );

    let discordSent = false;
    let emailed = false;

    // 1) Gui qua Discord webhook (kenh chinh)
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (webhook) {
      try {
        await sendDiscord(webhook, order);
        discordSent = true;
      } catch (e) {
        console.error("⚠️  Lỗi gửi Discord:", e.message);
      }
    }

    // 2) Email (tuy chon, neu co cau hinh SMTP)
    const transport = createTransport();
    if (transport) {
      try {
        await transport.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || "LnD clozet"}" <${process.env.SMTP_USER}>`,
          to: process.env.ORDER_EMAIL_TO || process.env.SMTP_USER,
          subject: `🛍️ Đơn hàng mới từ ${customer.name} - ${VND(totals.total)}`,
          html: buildOrderHtml(order)
        });
        emailed = true;
      } catch (e) {
        console.error("⚠️  Lỗi gửi email:", e.message);
      }
    }

    if (!discordSent && !emailed) {
      console.log("⚠️  Chưa cấu hình Discord/email - đơn hàng đã lưu vào orders.log");
      return res.json({
        ok: true,
        notified: false,
        totals,
        message: "Đã ghi nhận đơn hàng (chưa cấu hình kênh thông báo)."
      });
    }

    res.json({ ok: true, notified: true, discord: discordSent, emailed, totals, message: "Đặt hàng thành công!" });
  } catch (err) {
    console.error("Loi gui don hang:", err);
    res.status(500).json({ ok: false, error: "Có lỗi khi xử lý đơn hàng." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Shop đang chạy: http://localhost:${PORT}`);
});
